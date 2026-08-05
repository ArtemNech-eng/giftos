import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, MapPin, Plus, UsersRound } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

export const metadata = {
  title: "События",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const TYPE_EMOJI: Record<string, string> = {
  meetup: "🤝",
  walk: "🚶",
  game: "🎮",
  concert: "🎤",
  stream: "📡",
  other: "✨",
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  scope: "local" | "open";
  starts_at: string;
  city: { name: string } | null;
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const { city: cityFilter = "" } = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id")
    .eq("id", user.id)
    .maybeSingle();

  const cityOnly = cityFilter === "my";
  const { data: rawEvents } = await supabase
    .from("events")
    .select("id, title, description, event_type, scope, starts_at, cities!left(name)")
    .eq("is_cancelled", false)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(50);

  let events = ((rawEvents ?? []) as unknown as EventRow[]).map((row) => ({
    ...row,
    city: Array.isArray(row.city) ? (row.city[0] ?? null) : row.city,
  }));
  if (cityOnly && profile?.city_id) {
    events = events.filter((event) => event.scope === "open" || event.city?.name);
  }

  const upcoming = events.slice(0, 20);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link className="text-sm text-[#e3a3d5]" href="/feed">
          ← Лента
        </Link>
        <h1 className="text-lg font-bold">События</h1>
        <Link
          aria-label="Создать событие"
          className="grid size-9 place-items-center rounded-full bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff]"
          href="/events/new"
        >
          <Plus className="size-5" />
        </Link>
      </header>

      <nav className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#14161f] p-1">
        <Link
          className={`rounded-xl py-2 text-center text-sm font-bold ${
            !cityOnly
              ? "bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] text-white"
              : "text-[#aaa4b7]"
          }`}
          href="/events"
        >
          Все
        </Link>
        <Link
          className={`rounded-xl py-2 text-center text-sm font-bold ${
            cityOnly
              ? "bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] text-white"
              : "text-[#aaa4b7]"
          }`}
          href="/events?city=my"
        >
          Мой город
        </Link>
      </nav>

      <section className="mt-6">
        {upcoming.length === 0 ? (
          <EmptyState
            actionHref="/events/new"
            actionLabel="Создать событие"
            description="Встречи, прогулки и турниры появятся здесь."
            title="Событий пока нет"
          />
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((event) => {
              const start = new Date(event.starts_at);
              const dateLabel = new Intl.DateTimeFormat("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }).format(start);
              return (
                <Link
                  className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#171923] p-3"
                  href={`/events/${event.id}` as Route}
                  key={event.id}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7d45ff]/30 to-[#ff4b8a]/30 text-xl">
                    {TYPE_EMOJI[event.event_type] ?? "✨"}
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block truncate text-sm font-bold">
                      {event.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-[#aaa4b7]">
                      <CalendarDays className="size-3.5" /> {dateLabel}
                      {event.scope === "local" && event.city?.name ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" /> {event.city.name}
                        </span>
                      ) : (
                        <span className="text-[#8df0b4]">Открытое</span>
                      )}
                    </span>
                  </span>
                  <UsersRound className="size-4 shrink-0 text-[#aaa4b7]" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
