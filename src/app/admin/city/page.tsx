import Link from "next/link";
import {
  Activity,
  Coins,
  Gift,
  Handshake,
  Home,
  MapPin,
  MessageCircle,
  PartyPopper,
  Radio,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";

import { finishSeason, startSeason } from "@/app/admin/city/actions";
import { AdminNav } from "@/components/admin-nav";
import { requireModerator } from "@/lib/auth";

export const metadata = {
  title: "Активность города",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type DayRow = {
  day: string;
  dau: number;
  place_visits: number;
  hangouts_created: number;
  messages: number;
  streams_started: number;
  events_created: number;
  referrals: number;
  gifts_sent: number;
};

export default async function AdminCityPage() {
  const { supabase, role } = await requireModerator();
  const { data: rawDaily } = await supabase
    .from("admin_city_activity_daily")
    .select("*")
    .limit(30);
  const daily = (rawDaily ?? []) as DayRow[];
  const totals = daily.reduce(
    (acc, row) => ({
      dau: Math.max(acc.dau, Number(row.dau) || 0),
      visits: acc.visits + (Number(row.place_visits) || 0),
      hangouts: acc.hangouts + (Number(row.hangouts_created) || 0),
      messages: acc.messages + (Number(row.messages) || 0),
      streams: acc.streams + (Number(row.streams_started) || 0),
      events: acc.events + (Number(row.events_created) || 0),
      referrals: acc.referrals + (Number(row.referrals) || 0),
      gifts: acc.gifts + (Number(row.gifts_sent) || 0),
    }),
    {
      dau: 0,
      visits: 0,
      hangouts: 0,
      messages: 0,
      streams: 0,
      events: 0,
      referrals: 0,
      gifts: 0,
    },
  );

  const { data: activeSeason } = await supabase
    .from("city_seasons")
    .select("id, name, started_at")
    .eq("is_active", true)
    .maybeSingle();
  const { data: seasonLeader } = activeSeason
    ? await supabase
        .from("city_battle_entries")
        .select("points, cities!inner(name)")
        .eq("season_id", activeSeason.id)
        .order("points", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };
  const { data: finishedSeasons } = await supabase
    .from("city_seasons")
    .select("name, winner_city_name, winner_points, finished_at")
    .not("winner_city_id", "is", null)
    .order("finished_at", { ascending: false })
    .limit(10);
  const leaderName = (seasonLeader as { cities: Array<{ name: string }> } | null)
    ?.cities?.[0]?.name;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Активность города</h1>
        </div>
        <Activity className="mb-2 hidden size-8 text-[#d34872] sm:block" />
      </div>

      <AdminNav active="/admin/city" />

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="surface rounded-2xl p-4">
          <Activity className="size-5 text-[#d34872]" />
          <p className="mt-3 text-xs text-[#8e747c]">Макс. DAU</p>
          <b className="mt-1 block text-2xl">{totals.dau}</b>
        </div>
        <div className="surface rounded-2xl p-4">
          <MapPin className="size-5 text-[#d34872]" />
          <p className="mt-3 text-xs text-[#8e747c]">Визиты в места</p>
          <b className="mt-1 block text-2xl">{totals.visits}</b>
        </div>
        <div className="surface rounded-2xl p-4">
          <ShieldAlert className="size-5 text-[#d34872]" />
          <p className="mt-3 text-xs text-[#8e747c]">Создано тусовок</p>
          <b className="mt-1 block text-2xl">{totals.hangouts}</b>
        </div>
        <div className="surface rounded-2xl p-4">
          <Coins className="size-5 text-[#d34872]" />
          <p className="mt-3 text-xs text-[#8e747c]">Сообщений</p>
          <b className="mt-1 block text-2xl">{totals.messages}</b>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Динамика по дням</h2>
        {daily.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-[#e7d8dc] p-5 text-sm text-[#9b858c]">
            Данных пока нет — активность начнёт накапливаться с первыми пользователями
            города.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {daily.map((row) => (
              <div
                className="surface flex items-center justify-between rounded-2xl px-4 py-3"
                key={row.day}
              >
                <span className="text-sm font-semibold">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "short",
                  }).format(new Date(row.day))}
                </span>
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5 text-[#a13d5e]" /> {row.dau}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 text-[#a13d5e]" /> {row.place_visits}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Home className="size-3.5 text-[#a13d5e]" /> {row.hangouts_created}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="size-3.5 text-[#a13d5e]" /> {row.messages}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Radio className="size-3.5 text-[#a13d5e]" /> {row.streams_started}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <PartyPopper className="size-3.5 text-[#a13d5e]" />{" "}
                    {row.events_created}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Handshake className="size-3.5 text-[#a13d5e]" /> {row.referrals}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Gift className="size-3.5 text-[#a13d5e]" /> {row.gifts_sent}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Trophy className="size-5 text-[#d34872]" /> Сезоны битвы городов
        </h2>
        <div className="surface mt-4 rounded-2xl p-5">
          {activeSeason ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#8e747c]">Активный сезон</p>
                  <b className="mt-1 block text-lg">{activeSeason.name}</b>
                  <p className="mt-1 text-sm text-[#8e747c]">
                    {leaderName
                      ? `Сейчас лидирует: ${leaderName} · ${Number((seasonLeader as { points: number } | null)?.points ?? 0).toLocaleString("ru-RU")} баллов`
                      : "Баллов пока нет"}
                  </p>
                </div>
                <form action={finishSeason}>
                  <button
                    className="h-9 rounded-lg bg-[#df4f7d] px-3 text-sm font-semibold text-white"
                    type="submit"
                  >
                    Завершить сезон и наградить победителя
                  </button>
                </form>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#9b858c]">
                Город с наибольшим числом баллов получает «Кубок города» — жители
                получают статус «Чемпион города».
              </p>
            </>
          ) : (
            <p className="text-sm text-[#8e747c]">
              Активного сезона нет — начните новый, чтобы жители снова зарабатывали
              баллы.
            </p>
          )}
          <form action={startSeason} className="mt-4 flex flex-wrap items-center gap-2">
            <input
              className="h-9 min-w-52 rounded-lg border border-[#e7d8dc] bg-white px-3 text-sm"
              maxLength={120}
              name="name"
              placeholder="Название нового сезона (например, Сезон 2)"
              required
            />
            <button
              className="h-9 rounded-lg border border-[#ead9df] bg-white px-3 text-sm font-semibold text-[#765f66]"
              type="submit"
            >
              Начать новый сезон
            </button>
          </form>
        </div>

        <div className="mt-4 space-y-2">
          {(finishedSeasons ?? []).map((season) => (
            <div
              className="surface flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3"
              key={season.name + (season.finished_at ?? "")}
            >
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <Trophy className="size-4 text-[#b8860b]" /> {season.name} —{" "}
                {season.winner_city_name}
              </span>
              <span className="text-xs text-[#8e747c]">
                {Number(season.winner_points ?? 0).toLocaleString("ru-RU")} баллов ·{" "}
                {season.finished_at
                  ? new Intl.DateTimeFormat("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(season.finished_at))
                  : ""}
              </span>
            </div>
          ))}
          {(finishedSeasons ?? []).length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#e7d8dc] p-4 text-sm text-[#9b858c]">
              Завершённых сезонов пока нет — первым станет текущий.
            </p>
          )}
        </div>
      </section>

      <p className="mt-7 text-xs leading-5 text-[#9b858c]">
        DAU = уникальные пользователи с активностью в местах за день (место считается
        посещённым при входе/сообщении). Это базовые метрики концепции «Живой цифровой
        город»: возвращаемость, посещения мест, тусовки, приглашения.
      </p>

      <Link
        className="mt-4 inline-block text-sm font-semibold text-[#a13d5e]"
        href="/admin/reports"
      >
        ← К модерации
      </Link>
    </main>
  );
}
