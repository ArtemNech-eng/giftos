import Link from "next/link";
import { Activity, Coins, MapPin, ShieldAlert } from "lucide-react";

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

      <nav className="mt-6 flex gap-1 rounded-xl bg-[#f5e9ed] p-1">
        <Link
          className="flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#8e6a75] hover:text-[#bd3e66]"
          href="/admin/reports"
        >
          Жалобы
        </Link>
        <Link
          className="flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#8e6a75] hover:text-[#bd3e66]"
          href="/admin/stories"
        >
          Видео
        </Link>
        <Link
          className="flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#8e6a75] hover:text-[#bd3e66]"
          href="/admin/economy"
        >
          <Coins className="mr-1 size-4" /> Экономика
        </Link>
        <Link
          className="flex flex-1 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#bd3e66] shadow-sm"
          href="/admin/city"
        >
          <MapPin className="mr-1 size-4" /> Город
        </Link>
      </nav>

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
                  <span>👥 {row.dau}</span>
                  <span>📍 {row.place_visits}</span>
                  <span>🏠 {row.hangouts_created}</span>
                  <span>💬 {row.messages}</span>
                  <span>🔴 {row.streams_started}</span>
                  <span>🎉 {row.events_created}</span>
                  <span>🤝 {row.referrals}</span>
                  <span>🎁 {row.gifts_sent}</span>
                </span>
              </div>
            ))}
          </div>
        )}
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
