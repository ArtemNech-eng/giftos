import Link from "next/link";
import {
  Check,
  CircleDashed,
  Clock3,
  Compass,
  Copy,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  UserPlus,
  UserRound,
  UsersRound,
  Video,
  Waves,
} from "lucide-react";
import type { Route } from "next";

import { CreatorShareLink } from "@/components/creator-share-link";
import { InvitePosterShare } from "@/components/invite-poster-share";
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

type FirstWaveProgress = {
  city_id: string | null;
  city_name: string | null;
  qualified_referrals: number;
  next_milestone: number | null;
  achieved_milestones: number[];
};

const FIRST_WAVE_MILESTONES = [5, 15, 30];
const FIRST_WAVE_BONUS: Record<number, number> = { 5: 100, 15: 250, 30: 500 };

// One-time starter path «Первые шаги в городе» (mirrors the migration's
// step keys and bonus_settings.starter_quest_rewards).
const STARTER_STEPS = [
  {
    step: "profile_done",
    title: "Создать профиль",
    description: "Заполни анкету и интересы",
    reward: 50,
    href: "/settings" as Route,
    icon: UserRound,
  },
  {
    step: "wish_created",
    title: "Опубликовать желание",
    description: "Расскажи, что хочешь",
    reward: 100,
    href: "/wishes/new" as Route,
    icon: Sparkles,
  },
  {
    step: "story_published",
    title: "Выпустить story",
    description: "Покажи свой момент",
    reward: 150,
    href: "/stories/new" as Route,
    icon: Video,
  },
  {
    step: "place_activity",
    title: "Написать в место",
    description: "Оставь сообщение в месте города",
    reward: 200,
    href: "/places" as Route,
    icon: MessageCircle,
  },
  {
    step: "friend_invited",
    title: "Позвать друга",
    description: "Кто-то придёт по твоей ссылке",
    reward: 300,
    href: "/invite" as Route,
    icon: UserPlus,
  },
] as const;

type StarterState = {
  done: boolean;
  claimed: boolean;
  reward: number;
};

// Mirrors the daily_quests table (titles/rewards are kept in sync by the
// migration seed); statuses come from daily_quest_progress().
const DAILY_QUESTS = [
  {
    slug: "daily_login",
    title: "Заглянуть в город",
    description: "Открой приложение",
    reward: 5,
    href: "/feed" as Route,
    icon: Compass,
  },
  {
    slug: "daily_story_reaction",
    title: "Отреагировать на story",
    description: "Поддержи чей-то момент",
    reward: 10,
    href: "/feed" as Route,
    icon: Heart,
  },
  {
    slug: "daily_place_message",
    title: "Написать в место",
    description: "Оставь сообщение в месте города",
    reward: 10,
    href: "/places" as Route,
    icon: MessageCircle,
  },
  {
    slug: "daily_wish_support",
    title: "Поддержать желание",
    description: "Нажми «Хочу также»",
    reward: 10,
    href: "/wishes" as Route,
    icon: Sparkles,
  },
] as const;

export default async function BonusesPage() {
  const { supabase, user } = await requireUser();
  const [
    { data: wallet },
    { data: rawEntries },
    { data: referrals },
    { data: rawReferralProgress },
    { data: settings },
    { data: firstWaveRaw },
    { data: myProfile },
    { data: dailyQuestProgress },
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
    supabase.rpc("city_first_wave_progress"),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.rpc("daily_quest_progress"),
  ]);
  const entries = (rawEntries ?? []) as BonusEntry[];
  const referralProgress = (rawReferralProgress ?? []) as ReferralProgress[];
  const firstWave = (firstWaveRaw ?? null) as FirstWaveProgress | null;
  const firstWaveCount = firstWave?.qualified_referrals ?? 0;
  const firstWaveNext = firstWave?.next_milestone ?? null;
  const firstWaveAchieved = firstWave?.achieved_milestones ?? [];
  const firstWaveReached = firstWaveAchieved.length > 0;
  const firstWaveProgressPercent = firstWaveNext
    ? Math.min(100, Math.round((firstWaveCount / firstWaveNext) * 100))
    : firstWaveCount > 0
      ? 100
      : 0;
  const reward = settings?.referral_reward ?? 200;
  const referralCount = referrals?.length ?? 0;
  const referralSteps = [1, 3, 5, 10];
  const nextMilestone = referralSteps.find((need) => referralCount < need) ?? 0;
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
  const dailyProgress = (dailyQuestProgress ?? []) as Array<{
    quest_slug: string;
    completed_on: string;
  }>;
  const completedQuests = new Set(dailyProgress.map((item) => item.quest_slug));
  const dailyDoneCount = completedQuests.size;
  const dailyRewardEarned = DAILY_QUESTS.reduce(
    (sum, quest) => sum + (completedQuests.has(quest.slug) ? quest.reward : 0),
    0,
  );

  // Starter quest: claim done steps (idempotent) and read the full state.
  const { data: starterState } = await supabase.rpc("claim_starter_steps");
  const starterSteps = (starterState ?? {}) as Record<string, StarterState>;
  const starterDoneCount = STARTER_STEPS.filter(
    (step) => starterSteps[step.step]?.done,
  ).length;
  const starterTotalReward = STARTER_STEPS.reduce((sum, step) => sum + step.reward, 0);
  const starterEarnedReward = STARTER_STEPS.reduce(
    (sum, step) => sum + (starterSteps[step.step]?.claimed ? step.reward : 0),
    0,
  );
  const starterFinished = STARTER_STEPS.every((step) => starterSteps[step.step]?.done);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 py-5 text-[#241a2c]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#c7b1ff]">Реферальная программа</p>
          <h1 className="mt-1 text-2xl font-bold">Хочу-бонусы</h1>
        </div>
        <Sparkles className="size-7 text-[#a57513]" />
      </header>
      <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2a1a4d] via-[#4b2f7a] to-[#7a4fd0] p-6 text-white shadow-[0_16px_36px_rgba(63,37,98,.25)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Sparkles className="size-3.5" /> Твой заработок
        </span>
        <p className="mt-4 text-4xl font-black tracking-[-0.04em]">
          {wallet?.total_earned ?? 0} <span className="text-xl text-white/70">⭐</span>
        </p>
        <p className="mt-2 text-[11px] leading-5 text-white/75">
          Заработано за всё время. Приглашай друзей — и баланс растёт.
        </p>
        <div className="mt-4 rounded-2xl bg-black/20 p-3">
          <div className="flex items-center justify-between text-[10px] font-black">
            <span>До следующей награды</span>
            <span className="text-[#ffd35e]">
              {nextMilestone > 0
                ? `${Math.max(0, nextMilestone - (referrals?.length ?? 0))} друга`
                : "максимум"}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ffd35e] to-[#ff5d9a]"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    ((referrals?.length ?? 0) / Math.max(1, nextMilestone)) * 100,
                  ),
                )}%`,
              }}
            />
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-4 text-white/60">
          ⭐ — внутренние бонусы: пока внутри платформы, реальный вывод — после
          подключения выплат.
        </p>
      </section>
      <section className="mt-5 overflow-hidden rounded-[1.7rem] border border-[#e2d3f0] bg-white shadow-[0_10px_26px_rgba(69,43,94,.07)]">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#f4e9ff] to-[#fff0f7] px-4 py-3">
          <span className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-white text-[#8753e6] shadow-[0_4px_10px_rgba(117,73,208,.15)]">
              <Sparkles className="size-4" />
            </span>
            <span>
              <h2 className="text-sm font-black">Ежедневные задания</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                {dailyDoneCount > 0
                  ? `Сегодня: ${dailyDoneCount} из ${DAILY_QUESTS.length} · +${dailyRewardEarned} ⭐`
                  : `До ${DAILY_QUESTS.length} наград в день`}
              </p>
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-[#fff0a9] px-2.5 py-1 text-[10px] font-black text-[#735417]">
            +35 ⭐/день
          </span>
        </div>
        <div className="divide-y divide-[#f1e8f5]">
          {DAILY_QUESTS.map((quest) => {
            const done = completedQuests.has(quest.slug);
            const Icon = quest.icon;
            return (
              <div className="flex items-center gap-3 px-4 py-3" key={quest.slug}>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                    done ? "bg-[#e4f7ed] text-[#19885e]" : "bg-[#f0e9ff] text-[#8753e6]"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 grow">
                  <b className="block truncate text-xs">{quest.title}</b>
                  <small className="mt-0.5 block truncate text-[10px] text-[#81748a]">
                    {quest.description}
                  </small>
                </span>
                {done ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e4f7ed] px-2 py-1 text-[10px] font-black text-[#19885e]">
                    <Check className="size-3" /> Готово
                  </span>
                ) : (
                  <Link
                    className="shrink-0 rounded-full bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-3 py-1.5 text-[10px] font-black text-white shadow-[0_5px_12px_rgba(160,75,213,.2)]"
                    href={quest.href}
                  >
                    +{quest.reward} ⭐
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        <p className="border-t border-[#f1e8f5] px-4 py-2.5 text-[9px] leading-4 text-[#a093a6]">
          Задания обновляются каждый день в 00:00. Бонусы начисляются автоматически за
          первые действия дня.
        </p>
      </section>
      <section className="mt-5 overflow-hidden rounded-[1.7rem] border border-[#f2ddc4] bg-white shadow-[0_10px_26px_rgba(69,43,94,.07)]">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#fff4e0] to-[#fff0f7] px-4 py-3">
          <span className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-white text-[#a87511] shadow-[0_4px_10px_rgba(168,117,17,.15)]">
              <Gift className="size-4" />
            </span>
            <span>
              <h2 className="text-sm font-black">Первые шаги в городе</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                {starterFinished
                  ? `Пройдено · +${starterEarnedReward} ⭐ получено`
                  : `${starterDoneCount} из ${STARTER_STEPS.length} · до +${starterTotalReward} ⭐`}
              </p>
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-[#fff0a9] px-2.5 py-1 text-[10px] font-black text-[#735417]">
            +{starterTotalReward} ⭐
          </span>
        </div>
        <div className="divide-y divide-[#f7ecdc]">
          {STARTER_STEPS.map((step, index) => {
            const state = starterSteps[step.step];
            const done = state?.done ?? false;
            const claimed = state?.claimed ?? false;
            const Icon = step.icon;
            return (
              <div className="flex items-center gap-3 px-4 py-3" key={step.step}>
                <span
                  className={`relative grid size-9 shrink-0 place-items-center rounded-xl ${
                    done ? "bg-[#e4f7ed] text-[#19885e]" : "bg-[#fff6e8] text-[#a87511]"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="absolute -left-1 -top-1 grid size-4 place-items-center rounded-full bg-[#a87511] text-[8px] font-black text-white">
                    {index + 1}
                  </span>
                </span>
                <span className="min-w-0 grow">
                  <b className="block truncate text-xs">{step.title}</b>
                  <small className="mt-0.5 block truncate text-[10px] text-[#81748a]">
                    {step.description}
                  </small>
                </span>
                {done ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e4f7ed] px-2 py-1 text-[10px] font-black text-[#19885e]">
                    {claimed ? (
                      <>
                        <Check className="size-3" /> +{step.reward} ⭐
                      </>
                    ) : (
                      "Выполнено"
                    )}
                  </span>
                ) : (
                  <Link
                    className="shrink-0 rounded-full border border-[#e8c88f] bg-[#fff8ea] px-3 py-1.5 text-[10px] font-black text-[#a87511]"
                    href={step.href}
                  >
                    +{step.reward} ⭐
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        <p className="border-t border-[#f7ecdc] px-4 py-2.5 text-[9px] leading-4 text-[#a093a6]">
          Разовые награды для новичка: по одной за каждый шаг. Начисляются
          автоматически, как только шаг выполнен.
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
      <section className="mt-6">
        <div className="flex items-end justify-between">
          <span>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#cda6ff]">
              Личная лестница
            </p>
            <h2 className="mt-1 font-bold">Награды за приглашения</h2>
          </span>
          <span className="text-right text-xs text-[#7b7083]">
            {referrals?.length ?? 0} / 10
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {[
            { need: 1, reward: 50, label: "1 друг" },
            { need: 3, reward: 100, label: "3 друга" },
            { need: 5, reward: 250, label: "5 друзей" },
            { need: 10, reward: 500, label: "10 друзей" },
          ].map((step) => {
            const done = (referrals?.length ?? 0) >= step.need;
            return (
              <div
                className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
                  done
                    ? "border-[#6bdbab]/50 bg-[#eefaf4]"
                    : "border-[#2c2036]/10 bg-white"
                }`}
                key={step.need}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-black ${
                    done ? "bg-[#6bdbab] text-[#0f2b1f]" : "bg-[#f0e9ff] text-[#7549d0]"
                  }`}
                >
                  {done ? <Check className="size-4" /> : step.need}
                </span>
                <span className="min-w-0 grow">
                  <b className="block text-xs">{step.label}</b>
                  <small className="text-[10px] text-[#81748a]">
                    {done
                      ? "Награда получена"
                      : `Пригласи ещё ${Math.max(0, step.need - (referrals?.length ?? 0))}`}
                  </small>
                </span>
                <b
                  className={`shrink-0 text-sm ${done ? "text-[#19885e]" : "text-[#a57513]"}`}
                >
                  +{step.reward} ⭐
                </b>
              </div>
            );
          })}
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
        {referralPath && (
          <InvitePosterShare
            cityName={cityName}
            inviterName={myProfile?.display_name ?? null}
            referralPath={referralPath}
            reward={reward}
          />
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
              const bonusRejected = referral.status === "rejected";
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
                            : bonusRejected
                              ? "Бонус не засчитан автоматически"
                              : "Ждём следующий шаг"}
                      </small>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        bonusReady
                          ? "bg-[#e4f7ed] text-[#19885e]"
                          : bonusHeld
                            ? "bg-[#fff4d6] text-[#a57513]"
                            : bonusRejected
                              ? "bg-[#fdeaea] text-[#c0392b]"
                              : "bg-[#f0e7fb] text-[#8750d1]"
                      }`}
                    >
                      {bonusReady
                        ? "ГОТОВО"
                        : bonusHeld
                          ? "ПРОВЕРКА"
                          : bonusRejected
                            ? "ОТКЛОНЕНО"
                            : "В ПУТИ"}
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
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#cda6ff]">
              Вместе, не в одиночку
            </p>
            <h2 className="mt-1 flex items-center gap-1.5 font-bold">
              <Waves className="size-4 text-[#2f9bb5]" />
              Первая волна{firstWave?.city_name ? ` · ${firstWave.city_name}` : ""}
            </h2>
          </div>
          {firstWaveReached && (
            <span className="rounded-full bg-gradient-to-r from-[#6bdbab] to-[#3fb98a] px-2.5 py-1 text-[10px] font-black text-[#0f2b1f]">
              ГОРОД ОЖИЛ
            </span>
          )}
        </div>

        {firstWave?.city_id ? (
          <>
            <div className="mt-3 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7b7083]">
                  {firstWaveCount} из {firstWaveNext ?? 30} активных жителей по
                  приглашениям
                </span>
                <b className="text-[#4e4258]">{firstWaveProgressPercent}%</b>
              </div>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-[#f0eaf5]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff5c99] to-[#8c58ff]"
                  style={{ width: `${Math.max(3, firstWaveProgressPercent)}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#7b7083]">
                {firstWaveReached
                  ? "Ваш город прошёл первую волну — теперь он живёт сам: новые жители приходят по приглашениям и остаются."
                  : firstWaveNext
                    ? `Когда в ${firstWave.city_name} станет ${firstWaveNext} активных жителей по приглашениям, город получит статус «Первая волна», а тот, кто приведёт последнего — бонус +${FIRST_WAVE_BONUS[firstWaveNext] ?? 0} ⭐.`
                    : "Все вехи пройдены — город в первой волне навсегда."}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {FIRST_WAVE_MILESTONES.map((milestone) => {
                const done = firstWaveAchieved.includes(milestone);
                return (
                  <div
                    className={`rounded-xl border p-3 text-center ${
                      done
                        ? "border-[#6bdbab]/50 bg-[#eefaf4]"
                        : "border-[#2c2036]/10 bg-white"
                    }`}
                    key={milestone}
                  >
                    <span className="text-lg font-black text-[#4e4258]">
                      {milestone}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#7b7083]">
                      жителей
                    </span>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        done
                          ? "bg-[#6bdbab] text-[#10231a]"
                          : "bg-[#f0eaf5] text-[#8e8797]"
                      }`}
                    >
                      {done ? (
                        <>
                          <Check className="size-3" /> +{FIRST_WAVE_BONUS[milestone]} ⭐
                        </>
                      ) : (
                        "+" + (FIRST_WAVE_BONUS[milestone] ?? 0) + " ⭐"
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-[#2c2036]/15 bg-white p-4 text-sm leading-6 text-[#7b7083]">
            Укажите город в профиле — и «Первая волна» города будет расти вместе с
            вашими приглашениями. Это общая победа, а не личный рейтинг.
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
                      : entry.type === "city_first_wave"
                        ? "Первая волна города"
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
