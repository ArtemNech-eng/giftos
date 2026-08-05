"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { optionalText, requiredText } from "@/lib/validation";

const reportTypes = new Set(["profile", "wish", "fundraiser", "comment", "message"]);
const reportReasons = new Set([
  "fraud",
  "prohibited_content",
  "false_information",
  "spam",
  "inappropriate_content",
  "other",
]);

export async function createReport(formData: FormData) {
  const { supabase, user } = await requireUser();
  const targetType = requiredText(formData.get("target_type"), 30);
  const targetId = requiredText(formData.get("target_id"), 100);
  const reason = requiredText(formData.get("reason"), 40);
  const details = optionalText(formData.get("details"), 2000);
  const returnTo = requiredText(formData.get("return_to"), 500) || "/";

  if (!reportTypes.has(targetType) || !reportReasons.has(reason) || !targetId) {
    throw new Error("Выберите причину и объект жалобы.");
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details,
  });

  if (error?.code === "23505") {
    redirect(`${returnTo}?report=already` as Route);
  }
  if (error) throw new Error(`Не удалось отправить жалобу: ${error.message}`);

  revalidatePath(returnTo);
  redirect(`${returnTo}?report=sent` as Route);
}

export async function blockUser(formData: FormData) {
  const { supabase, user } = await requireUser();
  const blockedId = requiredText(formData.get("blocked_id"), 100);
  const returnTo = requiredText(formData.get("return_to"), 500) || "/";
  if (!blockedId || blockedId === user.id)
    throw new Error("Нельзя заблокировать этот профиль.");

  const { error } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id: blockedId,
  });
  if (error?.code !== "23505" && error) {
    throw new Error(`Не удалось заблокировать пользователя: ${error.message}`);
  }

  revalidatePath(returnTo);
  redirect(`${returnTo}?blocked=1` as Route);
}

export async function unblockUser(formData: FormData) {
  const { supabase, user } = await requireUser();
  const blockedId = requiredText(formData.get("blocked_id"), 100);
  const returnTo = requiredText(formData.get("return_to"), 500) || "/";

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);
  if (error) throw new Error(`Не удалось снять блокировку: ${error.message}`);

  revalidatePath(returnTo);
  redirect(returnTo as Route);
}
