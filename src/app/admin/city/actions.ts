"use server";

import { revalidatePath } from "next/cache";

import { requireModerator } from "@/lib/auth";
import { requiredText } from "@/lib/validation";

/** Admin: close the active city battle season and crown the winner city. */
export async function finishSeason() {
  const { supabase, role } = await requireModerator();
  if (role !== "admin") throw new Error("Только администратор может завершить сезон.");

  const { error } = await supabase.rpc("finish_city_season");
  if (error) throw new Error(`Не удалось завершить сезон: ${error.message}`);

  revalidatePath("/admin/city");
  revalidatePath("/cities/battle");
  revalidatePath("/feed");
}

/** Admin: open a new season (finishes the current one first). */
export async function startSeason(formData: FormData) {
  const { supabase, role } = await requireModerator();
  if (role !== "admin") throw new Error("Только администратор может начать сезон.");

  const name = requiredText(formData.get("name"), 120);
  if (!name) throw new Error("Укажите название сезона.");

  const { error } = await supabase.rpc("start_city_season", { p_name: name });
  if (error) throw new Error(`Не удалось начать сезон: ${error.message}`);

  revalidatePath("/admin/city");
  revalidatePath("/cities/battle");
  revalidatePath("/feed");
}
