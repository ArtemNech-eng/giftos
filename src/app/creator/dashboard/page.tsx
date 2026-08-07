import Link from "next/link";
import {
  BarChart3,
  Bell,
  CirclePlus,
  FileText,
  Gift,
  MapPin,
  MessageCircle,
  Play,
  Radio,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { claimCityAmbassadorReward } from "@/app/creator/dashboard/actions";
import { CreatorShareLink } from "@/components/creator-share-link";
import { requireUser } from "@/lib/auth";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Панель автора",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function CreatorDashboardPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator, username, display_name, city")
    .eq("id", user.id)
    .maybeSingle();
  const [
    { count: followers },
    { count: stories },
    { count: posts },
    { count: requests },
    { data: ledger },
    { data: liveRooms },
    { data: rawAmbassadorProgress },
    { data: cityReferralPath },
  ] = await Promise.all([
    supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id),
    supabase
      .from("stories")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id)
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("creator_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id),
    supabase
      .from("paid_message_requests")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("creator_ledger_entries")
      .select("creator_net_minor")
      .eq("creator_id", user.id),
    supabase
      .from("live_rooms")
      .select("id, slug, title, status")
      .eq("host_id", user.id)
      .order("started_at", { ascending: false })
      .limit(5),
    supabase.rpc("city_ambassador_progress"),
    supabase.rpc("create_referral_link", { p_user_id: user.id }),
  ]);
  const income = (ledger ?? []).reduce(
    (sum, item) => sum + Number(item.creator_net_minor),
    0,
  );
  const activeLive = (liveRooms ?? []).find((room) => room.status === "live");
  const ambassadorProgress = (
    (rawAmbassadorProgress ?? []) as Array<{
      city_id: string | null;
      city_name: string | null;
      active_referrals: number;
      required_referrals: number;
      is_ambassador: boolean;
      promotion_credits: number;
    }>
  )[0];
  const ambassadorCity = ambassadorProgress?.city_name ?? profile?.city ?? null;
  const ambassadorGoal = ambassadorProgress?.required_referrals ?? 3;
  const ambassadorReferrals = ambassadorProgress?.active_referrals ?? 0;
  const ambassadorPercent = Math.min(
    100,
    Math.round((ambassadorReferrals / ambassadorGoal) * 100),
  );

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 py-5 text-[#241a2c]">
      {!profile?.is_creator ? (
        <div className="mt-14 rounded-2xl border border-[#2c2036]/10 bg-white p-6 text-center">
          <h1 className="text-xl font-bold">Создайте страницу автора</h1>
          <p className="mt-3 text-sm text-[#766b80]">
            Панель появится после активации creator-профиля.
          </p>
          <Link
            className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold text-white"
            href="/creator/start"
          >
            Хочу также
          </Link>
        </div>
      ) : (
        <>
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#766b80]">Панель автора</p>
              <h1 className="mt-1 text-2xl font-bold">
                Привет, {profile.display_name}
              </h1>
            </div>
            <Link
              className="grid size-10 place-items-center rounded-full bg-white"
              href="/notifications"
            >
              <Bell className="size-5" />
            </Link>
          </header>
          {ambassadorProgress && ambassadorCity && (
            <section className="mt-5 overflow-hidden rounded-[1.7rem] border border-[#ffbf6b]/35 bg-gradient-to-br from-[#fff5d8] via-[#fff9ef] to-[#f2e8ff] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#ffd579]">
                    <Sparkles className="size-3.5" /> Первая волна · {ambassadorCity}
                  </p>
                  <h2 className="mt-2 text-xl font-bold">
                    {ambassadorProgress.is_ambassador
                      ? "Амбассадор города"
                      : "Собери свой город"}
                  </h2>
                </div>
                <span className="grid size-11 place-items-center rounded-2xl bg-[#ffd35e]/15 text-xl">
                  🌆
                </span>
              </div>

              {ambassadorProgress.is_ambassador ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-[#665a72]">
                    Статус «Первая волна» уже виден в твоём профиле. У тебя есть
                    {ambassadorProgress.promotion_credits > 0
                      ? " бесплатное продвижение своей тусовки на 24 часа."
                      : " использованное продвижение своей тусовки."}
                  </p>
                  <Link
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#ffd35e] px-3.5 py-2 text-sm font-bold text-[#38240e]"
                    href="/places"
                  >
                    <MapPin className="size-4" /> Открыть мои места
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-6 text-[#665a72]">
                    Приведи {ambassadorGoal} активных жителей в {ambassadorCity} —
                    откроешь статус, оформление профиля и одно бесплатное продвижение
                    места.
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#54475e]">
                      <span>Активные приглашения</span>
                      <span>
                        {ambassadorReferrals} / {ambassadorGoal}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee7f4]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ffbf5e] to-[#ff6f9d]"
                        style={{ width: `${ambassadorPercent}%` }}
                      />
                    </div>
                  </div>
                  {cityReferralPath && (
                    <div className="mt-4">
                      <CreatorShareLink
                        label={`Пригласить в ${ambassadorCity}`}
                        light
                        path={cityReferralPath}
                      />
                    </div>
                  )}
                  {ambassadorReferrals >= ambassadorGoal && (
                    <form action={claimCityAmbassadorReward} className="mt-4">
                      <button
                        className="w-full rounded-xl bg-gradient-to-r from-[#ffd15c] to-[#ff8d78] px-4 py-3 text-sm font-black text-[#3b2514]"
                        type="submit"
                      >
                        Активировать статус амбассадора
                      </button>
                    </form>
                  )}
                </>
              )}
            </section>
          )}
          <section className="mt-5 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
            <p className="text-sm font-semibold">Приводите аудиторию</p>
            <p className="mt-1 text-xs leading-5 text-[#766b80]">
              Разместите персональную ссылку в Telegram, VK или социальных сетях.
            </p>
            <div className="mt-3">
              <CreatorShareLink light username={profile.username} />
            </div>
          </section>
          {activeLive ? (
            <section className="mt-5 overflow-hidden rounded-2xl border border-[#ff5b99]/40 bg-gradient-to-br from-[#fff0f6] to-[#f3ecff] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#ff7fb5]">🔴 Сейчас в эфире</p>
                  <p className="mt-1 font-bold">{activeLive.title}</p>
                </div>
                <Link
                  className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold text-white"
                  href={`/live/${activeLive.slug}`}
                >
                  Открыть
                </Link>
              </div>
            </section>
          ) : (
            <section className="mt-5 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Эфиры</p>
                  <p className="mt-1 text-xs text-[#766b80]">
                    Создайте комнату и пригласите зрителей.
                  </p>
                </div>
                <Link
                  aria-label="Создать эфир"
                  className="grid size-10 place-items-center rounded-full bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] text-white"
                  href="/live/new"
                  title="Создать эфир"
                >
                  <Radio className="size-5" />
                </Link>
              </div>
            </section>
          )}
          <section className="mt-5 rounded-[2rem] bg-gradient-to-br from-[#fff7ff] to-[#ebe4ff] p-6">
            <p className="text-sm text-[#766b80]">Тестовый баланс</p>
            <p className="mt-2 text-4xl font-bold">{formatRubles(income)}</p>
            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#f0a8d6]"
              href="/creator/earnings"
            >
              <WalletCards className="size-4" /> Подробнее о доходе ›
            </Link>
          </section>
          <section className="mt-5 grid grid-cols-2 gap-3">
            <Link
              className="rounded-2xl border border-[#2c2036]/10 bg-white p-4"
              href={`/u/${profile.username}`}
            >
              <UsersRound className="size-5 text-[#d68cff]" />
              <p className="mt-3 text-xs text-[#766b80]">Подписчики</p>
              <b className="mt-1 block text-xl">{followers ?? 0}</b>
            </Link>
            <Link
              className="rounded-2xl border border-[#2c2036]/10 bg-white p-4"
              href={`/u/${profile.username}`}
            >
              <Play className="size-5 text-[#ff83b9]" />
              <p className="mt-3 text-xs text-[#766b80]">Активные stories</p>
              <b className="mt-1 block text-xl">{stories ?? 0}</b>
            </Link>
            <Link
              className="rounded-2xl border border-[#2c2036]/10 bg-white p-4"
              href={`/u/${profile.username}`}
            >
              <FileText className="size-5 text-[#8db6ff]" />
              <p className="mt-3 text-xs text-[#766b80]">Посты</p>
              <b className="mt-1 block text-xl">{posts ?? 0}</b>
            </Link>
            <Link
              className="rounded-2xl border border-[#2c2036]/10 bg-white p-4"
              href="/creator/requests"
            >
              <MessageCircle className="size-5 text-[#ffd35e]" />
              <p className="mt-3 text-xs text-[#766b80]">Новые запросы</p>
              <b className="mt-1 block text-xl">{requests ?? 0}</b>
            </Link>
          </section>
          <section className="mt-6">
            <h2 className="font-bold">Быстрые действия</h2>
            <div className="mt-3 space-y-2">
              <Link
                className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-3 font-bold text-white"
                href={`/u/${profile.username}`}
              >
                <span className="flex items-center gap-2">
                  <CirclePlus className="size-5" /> Создать story или пост
                </span>
                <span>›</span>
              </Link>
              <Link
                className="flex items-center justify-between rounded-2xl border border-[#2c2036]/10 bg-white px-4 py-3"
                href="/creator/offer-requests"
              >
                <span className="flex items-center gap-2">
                  <Gift className="size-5 text-[#ffd35e]" /> Запросы на действия
                </span>
                <span>›</span>
              </Link>
              <Link
                className="flex items-center justify-between rounded-2xl border border-[#2c2036]/10 bg-white px-4 py-3"
                href="/creator/earnings"
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="size-5 text-[#d68cff]" /> Аналитика и доход
                </span>
                <span>›</span>
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
