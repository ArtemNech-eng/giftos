import { InviteScreen } from "@/components/invite-screen";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Приветствие по QR",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, city, city_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("bonus_settings")
      .select("referral_reward")
      .eq("id", true)
      .maybeSingle(),
  ]);
  const reward = settings?.referral_reward ?? 200;

  const { data: referralLink } = await supabase.rpc("create_referral_link", {
    p_user_id: user.id,
  });
  const referralPath = referralLink ?? "";
  const link = referralPath
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru"}${referralPath}`
    : "";

  let cityName: string | null = profile?.city ?? null;
  if (profile?.city_id) {
    const { data: city } = await supabase
      .from("cities")
      .select("name")
      .eq("id", profile.city_id)
      .maybeSingle();
    if (city) cityName = city.name;
  }

  return (
    <InviteScreen
      cityName={cityName}
      link={link}
      name={profile?.display_name ?? null}
      referralPath={referralPath}
      reward={reward}
    />
  );
}
