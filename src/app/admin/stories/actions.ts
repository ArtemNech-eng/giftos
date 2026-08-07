"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireModerator } from "@/lib/auth";
import { optionalText, requiredText } from "@/lib/validation";

/**
 * Reactive story moderation: hide a reported story (sets 'rejected' so it
 * disappears from the public feed) and close its open reports.
 */
export async function hideReportedStory(formData: FormData) {
  const { supabase, user } = await requireModerator();
  const storyId = requiredText(formData.get("story_id"), 100);
  const note = optionalText(formData.get("moderation_note"), 500) || null;
  if (!storyId) throw new Error("Story не найдена.");

  const { data: story } = await supabase
    .from("stories")
    .select("id, author_id")
    .eq("id", storyId)
    .maybeSingle();
  if (!story) throw new Error("Story не найдена.");

  const { error } = await supabase
    .from("stories")
    .update({
      moderation_status: "rejected",
      moderated_by: user.id,
      moderation_note: note,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", storyId);
  if (error) throw new Error(`Не удалось скрыть story: ${error.message}`);

  // Close every open report targeting this story.
  await supabase
    .from("reports")
    .update({
      status: "resolved",
      assigned_to: user.id,
      resolution_note: note ?? "Story скрыта",
      resolved_at: new Date().toISOString(),
    })
    .eq("target_type", "story")
    .eq("target_id", storyId)
    .in("status", ["open", "in_review"]);

  const { error: auditError } = await supabase.from("moderation_actions").insert({
    moderator_id: user.id,
    target_type: "story",
    target_id: storyId,
    action: "hide_story",
    note: note ?? undefined,
  });
  if (auditError) throw new Error(auditError.message);

  revalidatePath("/admin/stories");
  revalidatePath("/feed");
  revalidatePath(`/u/${story.author_id}`);
  redirect("/admin/stories");
}

/** Dismiss open reports on a story without hiding it. */
export async function dismissStoryReports(formData: FormData) {
  const { supabase, user } = await requireModerator();
  const storyId = requiredText(formData.get("story_id"), 100);
  if (!storyId) throw new Error("Story не найдена.");

  const { error } = await supabase
    .from("reports")
    .update({
      status: "dismissed",
      assigned_to: user.id,
      resolution_note: "Жалоба отклонена",
      resolved_at: new Date().toISOString(),
    })
    .eq("target_type", "story")
    .eq("target_id", storyId)
    .in("status", ["open", "in_review"]);
  if (error) throw new Error(`Не удалось закрыть жалобы: ${error.message}`);

  revalidatePath("/admin/stories");
  redirect("/admin/stories");
}
