import Link from "next/link";
import {
  BarChart3,
  Bell,
  CirclePlus,
  FileText,
  Gift,
  MessageCircle,
  Play,
  Radio,
  UsersRound,
  WalletCards,
} from "lucide-react";

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
    .select("is_creator, username, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const [
    { count: followers },
    { count: stories },
    { count: posts },
    { count: requests },
    { data: ledger },
    { data: liveRooms },
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
  ]);
  const income = (ledger ?? []).reduce(
    (sum, item) => sum + Number(item.creator_net_minor),
    0,
  );
  const activeLive = (liveRooms ?? []).find((room) => room.status === "live");

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      {!profile?.is_creator ? (
        <div className="mt-14 rounded-2xl border border-white/10 bg-[#171923] p-6 text-center">
          <h1 className="text-xl font-bold">Создайте страницу автора</h1>
          <p className="mt-3 text-sm text-[#b9b1c5]">
            Панель появится после активации creator-профиля.
          </p>
          <Link
            className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
            href="/creator/start"
          >
            Хочу также
          </Link>
        </div>
      ) : (
        <>
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#b9b1c5]">Панель автора</p>
              <h1 className="mt-1 text-2xl font-bold">
                Привет, {profile.display_name}
              </h1>
            </div>
            <Link
              className="bg-white/8 grid size-10 place-items-center rounded-full"
              href="/notifications"
            >
              <Bell className="size-5" />
            </Link>
          </header>
          <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
            <p className="text-sm font-semibold">Приводите аудиторию</p>
            <p className="mt-1 text-xs leading-5 text-[#aaa2b4]">
              Разместите персональную ссылку в Telegram, VK или социальных сетях.
            </p>
            <div className="mt-3">
              <CreatorShareLink username={profile.username} />
            </div>
          </section>
          {activeLive ? (
            <section className="mt-5 overflow-hidden rounded-2xl border border-[#ff5b99]/40 bg-gradient-to-br from-[#2a1222] to-[#171a2b] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#ff7fb5]">🔴 Сейчас в эфире</p>
                  <p className="mt-1 font-bold">{activeLive.title}</p>
                </div>
                <Link
                  className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
                  href={`/live/${activeLive.slug}`}
                >
                  Открыть
                </Link>
              </div>
            </section>
          ) : (
            <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Эфиры</p>
                  <p className="mt-1 text-xs text-[#aaa2b4]">
                    Создайте комнату и пригласите зрителей.
                  </p>
                </div>
                <Link
                  aria-label="Создать эфир"
                  className="grid size-10 place-items-center rounded-full bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff]"
                  href="/live/new"
                  title="Создать эфир"
                >
                  <Radio className="size-5" />
                </Link>
              </div>
            </section>
          )}
          <section className="mt-5 rounded-[2rem] bg-gradient-to-br from-[#291940] to-[#171a2b] p-6">
            <p className="text-sm text-[#c5bdd0]">Тестовый баланс</p>
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
              className="border-white/8 rounded-2xl border bg-[#171923] p-4"
              href={`/u/${profile.username}`}
            >
              <UsersRound className="size-5 text-[#d68cff]" />
              <p className="mt-3 text-xs text-[#a9a1b4]">Подписчики</p>
              <b className="mt-1 block text-xl">{followers ?? 0}</b>
            </Link>
            <Link
              className="border-white/8 rounded-2xl border bg-[#171923] p-4"
              href={`/u/${profile.username}`}
            >
              <Play className="size-5 text-[#ff83b9]" />
              <p className="mt-3 text-xs text-[#a9a1b4]">Активные stories</p>
              <b className="mt-1 block text-xl">{stories ?? 0}</b>
            </Link>
            <Link
              className="border-white/8 rounded-2xl border bg-[#171923] p-4"
              href={`/u/${profile.username}`}
            >
              <FileText className="size-5 text-[#8db6ff]" />
              <p className="mt-3 text-xs text-[#a9a1b4]">Посты</p>
              <b className="mt-1 block text-xl">{posts ?? 0}</b>
            </Link>
            <Link
              className="border-white/8 rounded-2xl border bg-[#171923] p-4"
              href="/creator/requests"
            >
              <MessageCircle className="size-5 text-[#ffd35e]" />
              <p className="mt-3 text-xs text-[#a9a1b4]">Новые запросы</p>
              <b className="mt-1 block text-xl">{requests ?? 0}</b>
            </Link>
          </section>
          <section className="mt-6">
            <h2 className="font-bold">Быстрые действия</h2>
            <div className="mt-3 space-y-2">
              <Link
                className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-3 font-bold"
                href={`/u/${profile.username}`}
              >
                <span className="flex items-center gap-2">
                  <CirclePlus className="size-5" /> Создать story или пост
                </span>
                <span>›</span>
              </Link>
              <Link
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171923] px-4 py-3"
                href="/creator/offer-requests"
              >
                <span className="flex items-center gap-2">
                  <Gift className="size-5 text-[#ffd35e]" /> Запросы на действия
                </span>
                <span>›</span>
              </Link>
              <Link
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171923] px-4 py-3"
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
