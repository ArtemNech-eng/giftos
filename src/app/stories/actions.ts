"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
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
  const { error } = await supabase.from("stories").insert({
    author_id: user.id,
    media_path: path,
    caption,
    access_type: accessType,
    unlock_price_minor: accessType === "paid" ? priceMinor : null,
  });

  if (error) {
    await createAdminClient().storage.from("story-media").remove([path]);
    throw new Error(`Не удалось опубликовать story: ${error.message}`);
  }

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
    .select("id, author_id, expires_at")
    .eq("id", storyId)
    .maybeSingle();
  if (!story || new Date(story.expires_at) <= new Date())
    throw new Error("Story больше недоступна.");

  const admin = createAdminClient();
  const { error } = await admin.from("story_unlocks").upsert(
    {
      story_id: story.id,
      viewer_id: user.id,
      status: "unlocked",
      provider: "stub",
      unlocked_at: new Date().toISOString(),
    },
    { onConflict: "story_id,viewer_id" },
  );
  if (error) throw new Error(`Не удалось открыть story: ${error.message}`);

  revalidatePath(`/stories/${story.id}`);
  redirect(`/stories/${story.id}` as Route);
}
