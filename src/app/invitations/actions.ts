"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { requiredText } from "@/lib/validation";

export async function acceptPrivateFundraiserInvite(formData: FormData) {
  const { supabase } = await requireUser();
  const fundraiserId = requiredText(formData.get("fundraiser_id"), 100);
  if (!fundraiserId) throw new Error("Приглашение не найдено.");

  const { data: slug, error } = await supabase.rpc("accept_private_fundraiser_invite", {
    p_fundraiser_id: fundraiserId,
  });
  if (error || !slug) {
    throw new Error(
      `Не удалось принять приглашение: ${error?.message ?? "неизвестная ошибка"}`,
    );
  }

  revalidatePath("/invitations");
  revalidatePath(`/fundraisers/${slug}`);
  redirect(`/fundraisers/${slug}`);
}

export async function declinePrivateFundraiserInvite(formData: FormData) {
  const { supabase } = await requireUser();
  const fundraiserId = requiredText(formData.get("fundraiser_id"), 100);
  if (!fundraiserId) throw new Error("Приглашение не найдено.");

  const { error } = await supabase.rpc("decline_private_fundraiser_invite", {
    p_fundraiser_id: fundraiserId,
  });
  if (error) throw new Error(`Не удалось отклонить приглашение: ${error.message}`);

  revalidatePath("/invitations");
  redirect("/invitations?declined=1");
}
