import Link from "next/link";
import { Copy, Gift, Sparkles, UsersRound } from "lucide-react";

import { CreatorShareLink } from "@/components/creator-share-link";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Хочу-бонусы",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type BonusEntry = {
  id: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
};

export default async function BonusesPage() {
  const { supabase, user } = await requireUser();
  const [
    { data: referralCode },
    { data: wallet },
    { data: rawEntries },
    { data: referrals },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("referral_codes")
      .select("code")
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase
      .from("bonus_wallets")
      .select("available_balance, total_earned, total_spent")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("bonus_ledger_entries")
      .select("id, amount, status, type, created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("referrals")
      .select("id, status, created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bonus_settings")
      .select("referral_reward, hold_days")
      .eq("id", true)
      .maybeSingle(),
  ]);
  const entries = (rawEntries ?? []) as BonusEntry[];
  const reward = settings?.referral_reward ?? 200;
  const referralPath = referralCode?.code ? `/r/${referralCode.code}` : "";
  const link = referralPath
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru"}${referralPath}`
    : "";

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#c7b1ff]">Реферальная программа</p>
          <h1 className="mt-1 text-2xl font-bold">Хочу-бонусы</h1>
        </div>
        <Sparkles className="size-7 text-[#ffd35e]" />
      </header>
      <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-[#2b193f] to-[#181a2b] p-6">
        <p className="text-sm text-[#c6bfd0]">Доступно</p>
        <p className="mt-2 text-4xl font-bold">{wallet?.available_balance ?? 0} ⭐</p>
        <p className="mt-3 text-xs leading-5 text-[#b8b0c3]">
          Бонусы не являются деньгами и используются только внутри платформы.
        </p>
      </section>
      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <p className="text-xs text-[#aaa2b4]">Приглашено</p>
          <b className="mt-1 block text-xl">{referrals?.length ?? 0}</b>
        </div>
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <p className="text-xs text-[#aaa2b4]">Получено</p>
          <b className="mt-1 block text-xl">{wallet?.total_earned ?? 0} ⭐</b>
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-[#d68cff]/30 bg-[#1c1528] p-5">
        <div className="flex items-center gap-3">
          <UsersRound className="size-6 text-[#e89aff]" />
          <div>
            <b>Приглашай друзей</b>
            <p className="mt-1 text-xs text-[#b9b1c5]">
              Получи {reward} ⭐ за каждого активного пользователя.
            </p>
          </div>
        </div>
        <div className="mt-4 break-all rounded-xl bg-black/20 p-3 text-xs text-[#d9d1e2]">
          {link || "Ссылка появится после настройки профиля"}
        </div>
        {referralPath && (
          <div className="mt-3">
            <CreatorShareLink path={referralPath} />
          </div>
        )}
      </section>
      <section className="mt-6">
        <h2 className="font-bold">Как получить ⭐</h2>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
            <span>1</span>
            <span>Друг регистрируется по вашей ссылке</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
            <span>2</span>
            <span>Заполняет профиль и выполняет первое действие</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
            <Gift className="size-4 text-[#ffd35e]" />
            <span>Вам начисляется {reward} ⭐</span>
          </div>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-bold">История бонусов</h2>
        {entries.length ? (
          <div className="mt-3 space-y-2">
            {entries.map((entry) => (
              <div
                className="border-white/8 flex items-center justify-between rounded-xl border bg-[#171923] p-3"
                key={entry.id}
              >
                <span>
                  <b className="block text-sm">
                    {entry.type === "referral_reward"
                      ? "Активный приглашённый"
                      : entry.type}
                  </b>
                  <small className="text-xs text-[#a9a1b4]">
                    {entry.status === "available" ? "Доступно" : "В обработке"}
                  </small>
                </span>
                <b className="text-[#ffd35e]">+{entry.amount} ⭐</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-[#aaa2b4]">
            Бонусы появятся после первого активного приглашённого.
          </div>
        )}
      </section>
      <Link
        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-[#e8a1d5]"
        href="/creator/dashboard"
      >
        <Copy className="size-4" /> К панели автора
      </Link>
    </main>
  );
}
