"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { optionalText } from "@/lib/validation";

const roles = new Set([
  "beauty",
  "photo",
  "music",
  "fitness",
  "education",
  "events",
  "food",
  "service",
  "other",
]);

/** Save the voluntary local creator card; it never creates a marketplace listing. */
export async function updateLocalCreatorProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const isListed = formData.get("is_listed") === "on";
  const roleCode = optionalText(formData.get("role_code"), 30) || "other";
  const headline = optionalText(formData.get("headline"), 120);
  if (!roles.has(roleCode)) throw new Error("Выберите корректную роль.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, city_id, profile_visibility, show_city")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) throw new Error("Профиль не найден.");
  if (!profile.city_id && isListed)
    throw new Error("Сначала выберите город в профиле.");
  if (isListed && (profile.profile_visibility !== "public" || !profile.show_city))
    throw new Error("Для локальной витрины сделайте профиль и город публичными.");

  const { error } = await supabase.from("local_creator_profiles").upsert({
    profile_id: user.id,
    is_listed: isListed,
    role_code: roleCode,
    headline,
    updated_at: new Date().toISOString(),
  });
  if (error)
    throw new Error(`Не удалось сохранить локальную витрину: ${error.message}`);

  revalidatePath("/local");
  revalidatePath("/places");
  if (profile.username) revalidatePath(`/u/${profile.username}`);
  redirect("/local?saved=1");
}
