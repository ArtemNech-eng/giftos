"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireModerator } from "@/lib/auth";
import { optionalText, requiredText } from "@/lib/validation";

export async function moderateStory(formData: FormData) {
  const { supabase, user } = await requireModerator();
  const storyId = requiredText(formData.get("story_id"), 100);
  const decision = formData.get("decision") === "rejected" ? "rejected" : "approved";
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
      moderation_status: decision,
      moderated_by: user.id,
      moderation_note: note,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", storyId);
  if (error) throw new Error(`Не удалось обновить story: ${error.message}`);

  const { error: auditError } = await supabase.from("moderation_actions").insert({
    moderator_id: user.id,
    target_type: "story",
    target_id: storyId,
    action: decision === "approved" ? "approve_story" : "reject_story",
    note: note ?? undefined,
  });
  if (auditError) throw new Error(auditError.message);

  revalidatePath("/admin/stories");
  revalidatePath("/feed");
  revalidatePath(`/u/${story.author_id}`);
  redirect("/admin/stories");
}
