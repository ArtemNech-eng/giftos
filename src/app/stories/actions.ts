"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { awardCityPoints } from "@/lib/city-battle";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUploadedFile, uploadOwnedStoryVideo } from "@/lib/media";
import { parseAmountToMinor } from "@/lib/money";
import { optionalText, requiredText } from "@/lib/validation";

export async function createStory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = requiredText(formData.get("username"), 100);
  const caption = optionalText(formData.get("caption"), 500);
  const accessType = formData.get("access_type") === "paid" ? "paid" : "free";
  const priceMinor = parseAmountToMinor(formData.get("unlock_price"));
  const video = formData.get("video");

  if (!username || !isUploadedFile(video)) throw new Error("Выберите видео для story.");
  if (accessType === "paid" && (!priceMinor || priceMinor <= 0)) {
    throw new Error("Укажите стоимость платной story.");
  }

  const path = await uploadOwnedStoryVideo({ file: video, ownerId: user.id });
  const { data: story, error } = await supabase
    .from("stories")
    .insert({
      author_id: user.id,
      media_path: path,
      caption,
      access_type: accessType,
      unlock_price_minor: accessType === "paid" ? priceMinor : null,
    })
    .select("id")
    .single();

  if (error) {
    await createAdminClient().storage.from("story-media").remove([path]);
    throw new Error(`Не удалось опубликовать story: ${error.message}`);
  }

  // City battle: qualified action (story published).
  await awardCityPoints(supabase, "story_published", story?.id);

  revalidatePath("/");
  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}` as Route);
}

export async function testUnlockStory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const storyId = requiredText(formData.get("story_id"), 100);
  if (!storyId) throw new Error("Story не найдена.");

  const { data: story } = await supabase
    .from("stories")
    .select("id, author_id, expires_at, unlock_price_minor, currency")
    .eq("id", storyId)
    .maybeSingle();
  if (!story || new Date(story.expires_at) <= new Date())
    throw new Error("Story больше недоступна.");

  const admin = createAdminClient();
  const { data: unlock, error } = await admin
    .from("story_unlocks")
    .upsert(
      {
        story_id: story.id,
        viewer_id: user.id,
        status: "unlocked",
        provider: "stub",
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: "story_id,viewer_id" },
    )
    .select("id")
    .single();
  if (error || !unlock)
    throw new Error(
      `Не удалось открыть story: ${error?.message ?? "неизвестная ошибка"}`,
    );

  const grossMinor = Number(story.unlock_price_minor ?? 0);
  const platformFeeMinor = Math.round(grossMinor * 0.2);
  const { error: ledgerError } = await admin.from("creator_ledger_entries").upsert(
    {
      creator_id: story.author_id,
      source_type: "story_unlock",
      source_id: unlock.id,
      gross_minor: grossMinor,
      platform_fee_minor: platformFeeMinor,
      creator_net_minor: grossMinor - platformFeeMinor,
      currency: story.currency,
      status: "test",
    },
    { onConflict: "source_type,source_id" },
  );
  if (ledgerError)
    throw new Error(`Не удалось зафиксировать тестовый доход: ${ledgerError.message}`);

  revalidatePath(`/stories/${story.id}`);
  redirect(`/stories/${story.id}` as Route);
}
