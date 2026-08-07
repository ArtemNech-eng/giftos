import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/components/onboarding-flow";
import { requireUser } from "@/lib/auth";
import { detectCityByIp } from "@/lib/geo";

export const metadata = {
  title: "Первый вход",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, display_name, bio, city, show_city, profile_visibility, allow_direct_messages, onboarding_completed_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) redirect("/feed");

  const [{ data: cities }, cookieStore, headerList] = await Promise.all([
    supabase
      .from("cities")
      .select("name, normalized_name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(50),
    cookies(),
    headers(),
  ]);
  const cityNames = (cities ?? []).map((city) => city.name);

  const referralCitySlug = (cookieStore.get("ht_city")?.value ?? "")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/-/g, " ")
    .replace(/ё/g, "е");
  const referralCity = (cities ?? []).find(
    (city) => city.normalized_name === referralCitySlug,
  )?.name;

  let detectedCity: string | null = null;
  if (!profile?.city && !referralCity) {
    const forwarded =
      headerList.get("x-forwarded-for") ?? headerList.get("x-real-ip") ?? "";
    const clientIp = forwarded.split(",")[0]?.trim();
    if (clientIp) {
      const geo = await detectCityByIp(clientIp);
      detectedCity = geo?.city ?? null;
    }
  }

  const cityPrefill = profile?.city ?? referralCity ?? detectedCity ?? "";
  const cityHint = referralCity
    ? `Тебя пригласили в ${referralCity}. Город можно изменить.`
    : detectedCity
      ? `Предложили ${detectedCity}. Город можно изменить.`
      : null;

  return (
    <OnboardingFlow
      cityHint={cityHint}
      cityNames={cityNames}
      profile={{
        username: profile?.username ?? "",
        displayName: profile?.display_name ?? "",
        bio: profile?.bio ?? "",
        city: cityPrefill,
        showCity: profile?.show_city ?? false,
        profileVisibility:
          profile?.profile_visibility === "private" ? "private" : "public",
        allowDirectMessages: profile?.allow_direct_messages ?? true,
      }}
    />
  );
}
