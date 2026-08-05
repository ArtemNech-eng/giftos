"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { requiredText } from "@/lib/validation";

const allowedReactions = new Set(["heart", "fire", "wow"]);

export async function toggleStoryReaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const storyId = requiredText(formData.get("story_id"), 100);
  const reaction = requiredText(formData.get("reaction"), 20);
  if (!storyId || !allowedReactions.has(reaction))
    throw new Error("Реакция недоступна.");

  const { data: existing } = await supabase
    .from("story_reactions")
    .select("story_id")
    .eq("story_id", storyId)
    .eq("sender_id", user.id)
    .eq("reaction", reaction)
    .maybeSingle();
  const { error } = existing
    ? await supabase
        .from("story_reactions")
        .delete()
        .eq("story_id", storyId)
        .eq("sender_id", user.id)
        .eq("reaction", reaction)
    : await supabase
        .from("story_reactions")
        .insert({ story_id: storyId, sender_id: user.id, reaction });
  if (error) throw new Error(`Не удалось обновить реакцию: ${error.message}`);

  revalidatePath(`/stories/${storyId}`);
  redirect(`/stories/${storyId}` as Route);
}
