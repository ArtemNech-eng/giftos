"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requiredText } from "@/lib/validation";

export async function toggleUserFollow(formData: FormData) {
  const { supabase } = await requireUser();
  const targetProfileId = requiredText(formData.get("profile_id"), 100);
  const username = requiredText(formData.get("username"), 100);
  if (!targetProfileId || !username) throw new Error("Профиль для подписки не найден.");

  const { error } = await supabase.rpc("toggle_user_follow", {
    p_target_profile_id: targetProfileId,
  });
  if (error) throw new Error(`Не удалось изменить подписку: ${error.message}`);

  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}`);
}

export async function toggleFundraiserFollow(formData: FormData) {
  const { supabase, user } = await requireUser();
  const fundraiserId = requiredText(formData.get("fundraiser_id"), 100);
  const slug = requiredText(formData.get("fundraiser_slug"), 100);
  if (!fundraiserId || !slug) throw new Error("Сбор для подписки не найден.");

  // Was the user following before the toggle? If not, notify the author.
  const { data: existing } = await supabase
    .from("fundraiser_follows")
    .select("profile_id")
    .eq("profile_id", user.id)
    .eq("fundraiser_id", fundraiserId)
    .maybeSingle();

  const { error } = await supabase.rpc("toggle_fundraiser_follow", {
    p_fundraiser_id: fundraiserId,
  });
  if (error) throw new Error(`Не удалось изменить подписку: ${error.message}`);

  if (!existing) {
    try {
      const { data: fundraiser } = await supabase
        .from("fundraisers")
        .select("author_id, title")
        .eq("id", fundraiserId)
        .maybeSingle();
      if (fundraiser && fundraiser.author_id !== user.id) {
        await createAdminClient()
          .from("notifications")
          .insert({
            recipient_id: fundraiser.author_id,
            actor_id: user.id,
            type: "fundraiser_follow",
            entity_type: "fundraiser",
            entity_id: fundraiserId,
            payload: { slug, title: fundraiser.title },
          });
      }
    } catch {
      // Notification failure must not break the follow toggle.
    }
  }

  revalidatePath(`/fundraisers/${slug}`);
  redirect(`/fundraisers/${slug}`);
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  if (error) throw new Error(`Не удалось отметить уведомления: ${error.message}`);

  revalidatePath("/notifications");
  redirect("/notifications?read=1");
}
