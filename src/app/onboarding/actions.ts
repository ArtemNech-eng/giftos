"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { awardCityPoints } from "@/lib/city-battle";
import { clientIp } from "@/lib/ip";
import { isUploadedFile, uploadOwnedImage } from "@/lib/media";
import {
  optionalText,
  requiredText,
  normalizeUsername,
  USERNAME_PATTERN,
} from "@/lib/validation";

export type OnboardingActionState = { error?: string } | null;

export async function completeOnboarding(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  try {
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
      return {
        error: "Username: 3–30 символов, только латиница, цифры и _. ",
      };
    }
    if (!displayName)
      return { error: "Укажите имя, которое увидят другие пользователи." };
    if (interestSlugs.length === 0) return { error: "Выберите хотя бы один интерес." };

    // Normalize the free-text city to a stable catalog entry (city_id).
    let cityId: string | null = null;
    if (city) {
      const { data: resolved } = await supabase.rpc("resolve_city", {
        p_city: city,
      });
      cityId = resolved ?? null;
    }

    let avatarPath: string | undefined;
    const avatar = formData.get("avatar");
    if (isUploadedFile(avatar)) {
      avatarPath = await uploadOwnedImage({
        file: avatar,
        ownerId: user.id,
        bucket: "avatars",
      });
    }

    const registrationIp = await clientIp();

    const profileUpdate = {
      username,
      display_name: displayName,
      bio,
      city,
      city_id: cityId,
      show_city: formData.get("show_city") === "on",
      // City Moments are opt-in from the first session; they stay off unless
      // the person explicitly chooses to share eligible public actions.
      share_city_moments: formData.get("share_city_moments") === "on",
      allow_direct_messages: formData.get("allow_direct_messages") === "on",
      profile_visibility:
        formData.get("profile_visibility") === "private" ? "private" : "public",
      onboarding_completed_at: new Date().toISOString(),
      // Referral anti-fraud: recorded once at onboarding, used to refuse
      // self-invites (same IP) and farming cascades.
      ...(registrationIp ? { registration_ip: registrationIp } : {}),
      ...(avatarPath ? { avatar_path: avatarPath } : {}),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (profileError) {
      if (profileError.code === "23505") {
        return { error: "Этот username уже занят. Выберите другой." };
      }
      return { error: `Не удалось сохранить профиль: ${profileError.message}` };
    }

    const { error: clearInterestsError } = await supabase
      .from("profile_interests")
      .delete()
      .eq("profile_id", user.id);
    if (clearInterestsError) return { error: clearInterestsError.message };

    const { error: interestsError } = await supabase.from("profile_interests").insert(
      interestSlugs.map((category_slug) => ({
        profile_id: user.id,
        category_slug,
      })),
    );
    if (interestsError)
      return { error: `Не удалось сохранить интересы: ${interestsError.message}` };

    // City battle: qualified action (profile completed).
    await awardCityPoints(supabase, "profile_completed", user.id);

    // Signup bonus: first stars for the very first gift (idempotent).
    try {
      await supabase.rpc("claim_signup_bonus");
    } catch {
      // The bonus must never block onboarding.
    }

    // Entering a city changes every city-first surface for this person.
    for (const path of [
      "/",
      "/feed",
      "/places",
      "/people",
      "/city/rankings",
      "/settings",
      "/local",
    ])
      revalidatePath(path);
    revalidatePath(`/u/${username}`);
    redirect("/feed");
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message
          ? err.message
          : "Не получилось завершить регистрацию. Попробуй ещё раз.",
    };
  }
}
