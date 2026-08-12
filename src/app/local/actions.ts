"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { optionalText } from "@/lib/validation";

const roles = new Set([
  "creator",
  "beauty",
  "photo",
  "music",
  "fitness",
  "education",
  "events",
  "food",
  "transport",
  "retail",
  "film",
  "health",
  "public",
  "service",
  "other",
]);

/** Save the voluntary local creator card; it never creates a marketplace listing. */
export type LocalActionState = { error?: string } | null;

export async function updateLocalCreatorProfile(
  _prev: LocalActionState,
  formData: FormData,
): Promise<LocalActionState> {
  try {
    const { supabase, user } = await requireUser();
    const isListed = formData.get("is_listed") === "on";
    const roleCode = optionalText(formData.get("role_code"), 30) || "other";
    const cityLabel = optionalText(formData.get("city_label"), 40);
    const headline = optionalText(formData.get("headline"), 120);
    if (!roles.has(roleCode)) return { error: "Выберите корректную роль." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, city_id, profile_visibility, show_city")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile) return { error: "Профиль не найден." };
    if (!profile.city_id && isListed)
      return { error: "Сначала выберите город в профиле." };
    if (isListed && (profile.profile_visibility !== "public" || !profile.show_city))
      return {
        error: "Для локальной витрины сделайте профиль и город публичными.",
      };

    const { error } = await supabase.from("local_creator_profiles").upsert({
      profile_id: user.id,
      is_listed: isListed,
      role_code: roleCode,
      city_label: cityLabel,
      headline,
      updated_at: new Date().toISOString(),
    });
    if (error)
      return {
        error: `Не удалось сохранить локальную витрину: ${error.message}`,
      };

    revalidatePath("/local");
    revalidatePath("/places");
    if (profile.username) revalidatePath(`/u/${profile.username}`);
    redirect("/local?saved=1");
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message
          ? err.message
          : "Не получилось сохранить. Попробуй ещё раз.",
    };
  }
}
