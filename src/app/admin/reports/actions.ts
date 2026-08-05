"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireModerator } from "@/lib/auth";
import { requiredText } from "@/lib/validation";

export async function resolveReport(formData: FormData) {
  const { supabase, user } = await requireModerator();
  const reportId = requiredText(formData.get("report_id"), 100);
  const status = formData.get("status") === "dismissed" ? "dismissed" : "resolved";
  const note = requiredText(formData.get("resolution_note"), 2000) || null;
  if (!reportId) throw new Error("Жалоба не найдена.");

  const { error } = await supabase
    .from("reports")
    .update({
      status,
      assigned_to: user.id,
      resolution_note: note,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) throw new Error(`Не удалось обновить жалобу: ${error.message}`);

  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}

export async function moderateTarget(formData: FormData) {
  const { supabase, user } = await requireModerator();
  const targetType = requiredText(formData.get("target_type"), 40);
  const targetId = requiredText(formData.get("target_id"), 100);
  const action = requiredText(formData.get("action"), 100);
  const reportId = requiredText(formData.get("report_id"), 100);

  if (!targetType || !targetId || !action)
    throw new Error("Недостаточно данных для модерации.");

  if (action === "hide_comment" && targetType === "comment") {
    const { error } = await supabase
      .from("fundraiser_comments")
      .update({ is_hidden: true })
      .eq("id", targetId);
    if (error) throw new Error(error.message);
  } else if (action === "hide_wish" && targetType === "wish") {
    const { error } = await supabase
      .from("wishes")
      .update({ is_archived: true })
      .eq("id", targetId);
    if (error) throw new Error(error.message);
  } else if (action === "hide_wish_comment" && targetType === "wish_comment") {
    const { error } = await supabase
      .from("wish_comments")
      .update({ is_hidden: true })
      .eq("id", targetId);
    if (error) throw new Error(error.message);
  } else if (action === "hide_story" && targetType === "story") {
    const { error } = await supabase
      .from("stories")
      .update({ moderation_status: "rejected", moderated_at: new Date().toISOString() })
      .eq("id", targetId);
    if (error) throw new Error(error.message);
  } else if (action === "end_live_room" && targetType === "live_room") {
    const { error } = await supabase
      .from("live_rooms")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", targetId);
    if (error) throw new Error(error.message);
  } else if (action === "suspend_profile" && targetType === "profile") {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: true })
      .eq("id", targetId);
    if (error) throw new Error(error.message);
  } else if (action === "cancel_fundraiser" && targetType === "fundraiser") {
    const { error } = await supabase
      .from("fundraisers")
      .update({ status: "cancelled", closed_at: new Date().toISOString() })
      .eq("id", targetId);
    if (error) throw new Error(error.message);
  } else {
    throw new Error("Это действие недоступно для выбранного объекта.");
  }

  const { error: auditError } = await supabase.from("moderation_actions").insert({
    moderator_id: user.id,
    target_type: targetType,
    target_id: targetId,
    action,
  });
  if (auditError) throw new Error(auditError.message);

  if (reportId) {
    await supabase
      .from("reports")
      .update({
        status: "resolved",
        assigned_to: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId);
  }

  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}
