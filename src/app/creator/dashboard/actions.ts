"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";

/** Claim the earned first-wave city ambassador status and its one-time place boost. */
export async function claimCityAmbassadorReward() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.rpc("claim_city_ambassador_reward");
  if (error) {
    if (error.message.includes("Three active"))
      throw new Error("Нужно привести 3 активных жителей своего города.");
    if (error.message.includes("Choose a city"))
      throw new Error("Сначала укажите город в профиле.");
    throw new Error(`Не удалось активировать статус: ${error.message}`);
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  revalidatePath("/creator/dashboard");
  revalidatePath("/bonuses");
  if (profile?.username) revalidatePath(`/u/${profile.username}`);
  redirect("/creator/dashboard?ambassador=claimed");
}
