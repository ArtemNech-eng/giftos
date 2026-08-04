"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { isUploadedFile, uploadOwnedImage } from "@/lib/media";
import {
  optionalText,
  requiredText,
  normalizeUsername,
  USERNAME_PATTERN,
} from "@/lib/validation";

export async function completeOnboarding(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = normalizeUsername(formData.get("username"));
  const displayName = requiredText(formData.get("display_name"), 80);
  const bio = optionalText(formData.get("bio"), 500);
  const city = optionalText(formData.get("city"), 100);
  const interestSlugs = formData
    .getAll("interests")
    .filter((value): value is string => typeof value === "string")
    .slice(0, 8);

  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("Username: 3–30 символов, только латиница, цифры и _. ");
  }
  if (!displayName) throw new Error("Укажите имя, которое увидят другие пользователи.");
  if (interestSlugs.length === 0) throw new Error("Выберите хотя бы один интерес.");

  let avatarPath: string | undefined;
  const avatar = formData.get("avatar");
  if (isUploadedFile(avatar)) {
    avatarPath = await uploadOwnedImage({
      file: avatar,
      ownerId: user.id,
      bucket: "avatars",
    });
  }

  const profileUpdate = {
    username,
    display_name: displayName,
    bio,
    city,
    show_city: formData.get("show_city") === "on",
    allow_direct_messages: formData.get("allow_direct_messages") === "on",
    profile_visibility:
      formData.get("profile_visibility") === "private" ? "private" : "public",
    onboarding_completed_at: new Date().toISOString(),
    ...(avatarPath ? { avatar_path: avatarPath } : {}),
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);

  if (profileError) {
    if (profileError.code === "23505") {
      throw new Error("Этот username уже занят. Выберите другой.");
    }
    throw new Error(`Не удалось сохранить профиль: ${profileError.message}`);
  }

  const { error: clearInterestsError } = await supabase
    .from("profile_interests")
    .delete()
    .eq("profile_id", user.id);
  if (clearInterestsError) throw new Error(clearInterestsError.message);

  const { error: interestsError } = await supabase.from("profile_interests").insert(
    interestSlugs.map((category_slug) => ({
      profile_id: user.id,
      category_slug,
    })),
  );
  if (interestsError)
    throw new Error(`Не удалось сохранить интересы: ${interestsError.message}`);

  revalidatePath("/");
  revalidatePath(`/u/${username}`);
  redirect("/");
}
