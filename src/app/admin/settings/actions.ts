"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireModerator } from "@/lib/auth";

function toInt(value: FormDataEntryValue | null): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Admin: update platform bonus settings and limits. */
export async function updateSettings(formData: FormData) {
  const { supabase, role } = await requireModerator();
  if (role !== "admin") throw new Error("Только администратор может менять настройки.");

  const { error } = await supabase.rpc("admin_update_settings", {
    p_referral_reward: toInt(formData.get("referral_reward")),
    p_hold_days: toInt(formData.get("hold_days")),
    p_daily_spend_limit: toInt(formData.get("daily_spend_limit")),
    p_referral_daily_cap: toInt(formData.get("referral_daily_cap")),
    p_profile_promotion_cost: toInt(formData.get("profile_promotion_cost")),
    p_live_promotion_cost: toInt(formData.get("live_promotion_cost")),
    p_event_promotion_cost: toInt(formData.get("event_promotion_cost")),
  });
  if (error) throw new Error(`Не удалось сохранить: ${error.message}`);

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
