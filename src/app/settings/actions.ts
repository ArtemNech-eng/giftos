"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionalText, requiredText } from "@/lib/validation";

export async function updateProfileSettings(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName = requiredText(formData.get("display_name"), 80);
  const bio = optionalText(formData.get("bio"), 500);
  const city = optionalText(formData.get("city"), 100);
  const showCity = formData.get("show_city") === "on";
  const shareCityMoments = formData.get("share_city_moments") === "on";
  const allowDirectMessages = formData.get("allow_direct_messages") === "on";
  const profileVisibility =
    formData.get("profile_visibility") === "private" ? "private" : "public";

  if (!displayName) throw new Error("Укажите имя.");

  // Normalize the city to the catalog entry.
  let cityId: string | null = null;
  if (city) {
    const { data: resolved } = await supabase.rpc("resolve_city", { p_city: city });
    cityId = resolved ?? null;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio,
      city,
      city_id: cityId,
      show_city: showCity,
      share_city_moments: shareCityMoments,
      allow_direct_messages: allowDirectMessages,
      profile_visibility: profileVisibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error(`Не удалось сохранить: ${error.message}`);

  revalidatePath("/settings");
  revalidatePath("/feed");
  redirect("/settings?saved=1");
}

export async function changePassword(formData: FormData) {
  const { supabase } = await requireUser();
  const newPassword = requiredText(formData.get("new_password"), 200);
  if (newPassword.length < 8)
    throw new Error("Пароль должен быть не короче 8 символов.");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(`Не удалось сменить пароль: ${error.message}`);
  redirect("/settings?password=1");
}

export async function deleteAccount(formData: FormData) {
  const { supabase, user } = await requireUser();
  const confirm = requiredText(formData.get("confirm"), 20);
  if (confirm !== "УДАЛИТЬ") throw new Error("Введите УДАЛИТЬ для подтверждения.");

  // Hard-delete the profile; auth user removal cascades to all user data.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(`Не удалось удалить аккаунт: ${error.message}`);

  // Sign out locally and go to the landing.
  await supabase.auth.signOut();
  redirect("/" as Route);
}
