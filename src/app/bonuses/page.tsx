import Link from "next/link";
import {
  Check,
  CircleDashed,
  Clock3,
  Copy,
  Gift,
  MapPin,
  ShoppingBag,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { CreatorShareLink } from "@/components/creator-share-link";
import { ReferralQrCode } from "@/components/referral-qr-code";
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

type ReferralProgress = {
  referral_id: string;
  status: "registered" | "qualified" | "held" | "approved" | "rejected";
  created_at: string;
  onboarding_completed: boolean;
  first_action_completed: boolean;
  qualified_at: string | null;
  hold_until: string | null;
  approved_at: string | null;
};

export default async function BonusesPage() {
  const { supabase, user } = await requireUser();
  const [
    { data: wallet },
    { data: rawEntries },
    { data: referrals },
    { data: rawReferralProgress },
    { data: settings },
  ] = await Promise.all([
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
    supabase.rpc("referral_progress"),
    supabase
      .from("bonus_settings")
      .select("referral_reward, hold_days")
      .eq("id", true)
      .maybeSingle(),
  ]);
  const entries = (rawEntries ?? []) as BonusEntry[];
  const referralProgress = (rawReferralProgress ?? []) as ReferralProgress[];
  const reward = settings?.referral_reward ?? 200;
  const { data: referralLink } = await supabase.rpc("create_referral_link", {
    p_user_id: user.id,
  });
  const referralPath = referralLink ?? "";
  const link = referralPath
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru"}${referralPath}`
    : "";
  const cityTag = referralPath.includes("?city=")
    ? decodeURIComponent(referralPath.split("?city=")[1]).replace(/-/g, " ")
    : null;
  const cityName = cityTag
    ? cityTag.replace(/^./, (letter) => letter.toUpperCase())
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 py-5 text-[#241a2c]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#c7b1ff]">Реферальная программа</p>
          <h1 className="mt-1 text-2xl font-bold">Хочу-бонусы</h1>
        </div>
        <Sparkles className="size-7 text-[#a57513]" />
      </header>
      <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-[#fffaff] to-[#f0e8ff] p-6">
        <p className="text-sm text-[#766b80]">Доступно</p>
        <p className="mt-2 text-4xl font-bold">{wallet?.available_balance ?? 0} ⭐</p>
        <p className="mt-3 text-xs leading-5 text-[#766b80]">
          Бонусы не являются деньгами и используются только внутри платформы.
        </p>
      </section>
      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#2c2036]/10 bg-white p-4">
          <p className="text-xs text-[#7b7083]">Приглашено</p>
          <b className="mt-1 block text-xl">{referrals?.length ?? 0}</b>
        </div>
        <div className="rounded-2xl border border-[#2c2036]/10 bg-white p-4">
          <p className="text-xs text-[#7b7083]">Получено</p>
          <b className="mt-1 block text-xl">{wallet?.total_earned ?? 0} ⭐</b>
        </div>
      </section>
      <section className="mt-6 overflow-hidden rounded-[1.7rem] border border-[#c9a6ee]/55 bg-gradient-to-br from-[#fffaff] via-[#f6efff] to-[#f0f7ff] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#e89aff]/15 text-[#eda7ff]">
              <UsersRound className="size-6" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#cda6ff]">
                Приглашение в город
              </p>
              <h2 className="mt-0.5 text-lg font-bold">
                {cityName ? `Зови в ${cityName}` : "Приглашай друзей"}
              </h2>
            </div>
          </div>
          <span className="rounded-full bg-gradient-to-r from-[#ff5c99] to-[#8c58ff] px-3 py-1.5 text-sm font-black shadow-[0_8px_22px_rgba(205,82,231,0.28)]">
            +{reward} ⭐
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#665a72]">
          Отправь ссылку или QR. Друг увидит, что его приглашают
          {cityName ? ` в ${cityName}` : " в твой город"}, а тебе начислят бонус после
          его активного первого действия.
        </p>
        {cityName && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#ffd35e]/25 bg-[#fff2bf] px-3 py-2.5 text-xs font-semibold text-[#8e6714]">
            <MapPin className="size-4 shrink-0" />
            Приглашение закрепляет город «{cityName}» в onboarding и даёт городу баллы.
          </div>
        )}
        <div className="mt-4 break-all rounded-xl border border-[#2c2036]/10 bg-[#f7f2fa] p-3 text-xs text-[#665a72]">
          {link || "Ссылка появится после настройки профиля"}
        </div>
        {referralPath && (
          <div className="mt-3">
            <CreatorShareLink
              light
              label="Скопировать приглашение"
              path={referralPath}
            />
          </div>
        )}
        {link && (
          <div className="mt-5 flex justify-center">
            <ReferralQrCode cityName={cityName} reward={reward} url={link} />
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#cda6ff]">
              Без догадок
            </p>
            <h2 className="mt-1 font-bold">Путь до +{reward} ⭐</h2>
          </div>
          <span className="text-right text-xs leading-5 text-[#7b7083]">
            Только реальные этапы
          </span>
        </div>

        {referralProgress.length > 0 ? (
          <div className="mt-3 space-y-3">
            {referralProgress.slice(0, 5).map((referral, index) => {
              const bonusReady = referral.status === "approved";
              const bonusHeld = referral.status === "held";
              const firstActionDone = referral.first_action_completed;
              return (
                <article
                  className="rounded-2xl border border-[#2c2036]/10 bg-white p-4"
                  key={referral.referral_id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      <b className="block text-sm">Приглашение #{index + 1}</b>
                      <small className="mt-0.5 block text-xs text-[#7b7083]">
                        {bonusReady
                          ? `+${reward} ⭐ начислены`
                          : bonusHeld
                            ? "Бонус на проверке"
                            : "Ждём следующий шаг"}
                      </small>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        bonusReady
                          ? "bg-[#e4f7ed] text-[#19885e]"
                          : bonusHeld
                            ? "bg-[#fff4d6] text-[#a57513]"
                            : "bg-[#f0e7fb] text-[#8750d1]"
                      }`}
                    >
                      {bonusReady ? "ГОТОВО" : bonusHeld ? "ПРОВЕРКА" : "В ПУТИ"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: "Вход", done: true },
                      { label: "Профиль", done: referral.onboarding_completed },
                      { label: "Первое действие", done: firstActionDone },
                    ].map((step) => (
                      <div className="min-w-0" key={step.label}>
                        <span
                          className={`grid size-6 place-items-center rounded-full text-xs ${
                            step.done
                              ? "bg-[#6bdbab] text-[#10231a]"
                              : "bg-[#f0eaf5] text-[#8e8797]"
                          }`}
                        >
                          {step.done ? (
                            <Check className="size-3.5" />
                          ) : (
                            <CircleDashed className="size-3.5" />
                          )}
                        </span>
                        <span
                          className={`mt-1.5 block text-[10px] leading-4 ${
                            step.done ? "text-[#4e4258]" : "text-[#89828f]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {bonusHeld && referral.hold_until && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-[#a57513]">
                      <Clock3 className="size-3.5" /> Бонус станет доступен после
                      проверки.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-[#2c2036]/15 bg-white p-4 text-sm leading-6 text-[#7b7083]">
            Первый приглашённый появится здесь. Когда он заполнит профиль и сделает
            первое действие, этапы загорятся по-настоящему.
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-bold">Как получить ⭐</h2>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-[#f7f2fa] p-3 text-sm">
            <span>1</span>
            <span>Друг регистрируется по вашей ссылке</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#f7f2fa] p-3 text-sm">
            <span>2</span>
            <span>Заполняет профиль и выполняет первое действие</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#f7f2fa] p-3 text-sm">
            <Gift className="size-4 text-[#a57513]" />
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
                className="flex items-center justify-between rounded-xl border border-[#2c2036]/10 bg-white p-3"
                key={entry.id}
              >
                <span>
                  <b className="block text-sm">
                    {entry.type === "referral_reward"
                      ? "Активный приглашённый"
                      : entry.type}
                  </b>
                  <small className="text-xs text-[#7b7083]">
                    {entry.status === "available" ? "Доступно" : "В обработке"}
                  </small>
                </span>
                <b className="text-[#a57513]">+{entry.amount} ⭐</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-[#2c2036]/15 p-5 text-sm text-[#7b7083]">
            Бонусы появятся после первого активного приглашённого.
          </div>
        )}
      </section>
      <Link
        className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-[#a57513]"
        href="/shop"
      >
        <ShoppingBag className="size-4" /> Магазин: товары, VIP, подарки
      </Link>
      <Link
        className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-[#e8a1d5]"
        href="/creator/dashboard"
      >
        <Copy className="size-4" /> К панели автора
      </Link>
    </main>
  );
}
