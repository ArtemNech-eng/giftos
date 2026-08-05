import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { createEvent } from "@/app/events/actions";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать событие",
  robots: { index: false, follow: false },
};

export default async function NewEventPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city")
    .eq("id", user.id)
    .maybeSingle();

  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/events"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Создать событие</h1>
        <span className="w-9" />
      </header>

      <form action={createEvent} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-[#d8d0e0]" htmlFor="event-title">
            Название
          </label>
          <input
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            id="event-title"
            maxLength={120}
            name="title"
            placeholder="Вечерняя прогулка по центру"
            required
          />
        </div>
        <div>
          <label
            className="text-sm font-semibold text-[#d8d0e0]"
            htmlFor="event-description"
          >
            Описание
          </label>
          <textarea
            className="mt-1.5 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            id="event-description"
            maxLength={2000}
            name="description"
            placeholder="Что будем делать, где встречаемся?"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="text-sm font-semibold text-[#d8d0e0]"
              htmlFor="event-type"
            >
              Тип
            </label>
            <select
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
              defaultValue="meetup"
              id="event-type"
              name="event_type"
            >
              <option value="meetup">🤝 Встреча</option>
              <option value="walk">🚶 Прогулка</option>
              <option value="game">🎮 Игра</option>
              <option value="concert">🎤 Концерт</option>
              <option value="stream">📡 Совместный эфир</option>
              <option value="other">✨ Другое</option>
            </select>
          </div>
          <div>
            <label
              className="text-sm font-semibold text-[#d8d0e0]"
              htmlFor="event-scope"
            >
              Доступ
            </label>
            <select
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
              defaultValue="local"
              id="event-scope"
              name="scope"
            >
              <option value="local">
                📍 Локальное{profile?.city ? ` · ${profile.city}` : ""}
              </option>
              <option value="open">🌎 Открытое</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-[#d8d0e0]" htmlFor="event-start">
            Дата и время
          </label>
          <input
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            id="event-start"
            min={minDate}
            name="starts_at"
            required
            type="datetime-local"
          />
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] py-3 text-sm font-bold"
          type="submit"
        >
          <CalendarDays className="size-4" /> Создать событие
        </button>
      </form>
    </main>
  );
}
