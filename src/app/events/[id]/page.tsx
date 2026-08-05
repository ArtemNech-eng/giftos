import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, CalendarDays, MapPin, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { cancelEvent, joinEvent, leaveEvent } from "@/app/events/actions";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Событие",
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
  author_id: string;
  title: string;
  description: string | null;
  event_type: string;
  scope: "local" | "open";
  starts_at: string;
  is_cancelled: boolean;
  city: { name: string } | null;
};

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: rawEvent } = await supabase
    .from("events")
    .select(
      "id, author_id, title, description, event_type, scope, starts_at, is_cancelled, cities!left(name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!rawEvent) notFound();
  const event = {
    ...(rawEvent as unknown as EventRow),
    city: Array.isArray(rawEvent.cities)
      ? (rawEvent.cities[0] ?? null)
      : (rawEvent.cities as unknown as { name: string } | null),
  };

  const [{ data: author }, { data: attendees }, { data: joined }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", event.author_id)
      .maybeSingle(),
    supabase
      .from("event_attendees")
      .select("profile_id, profiles!inner(display_name)")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("event_attendees")
      .select("profile_id")
      .eq("event_id", event.id)
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const attendeeList = (
    (attendees ?? []) as Array<{
      profile_id: string;
      profiles: Array<{ display_name: string }>;
    }>
  ).flatMap((row) =>
    row.profiles?.[0]
      ? [{ profileId: row.profile_id, name: row.profiles[0].display_name }]
      : [],
  );
  const isAuthor = event.author_id === user.id;
  const isJoined = Boolean(joined);
  const start = new Date(event.starts_at);
  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/events"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Событие</h1>
        <span className="w-9" />
      </header>

      <article className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[#171923]">
        <div className="grid h-28 place-items-center bg-gradient-to-br from-[#2b193f] to-[#181a2b] text-5xl">
          {TYPE_EMOJI[event.event_type] ?? "✨"}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            {event.is_cancelled ? (
              <span className="rounded-full bg-[#ff5b99]/20 px-2.5 py-1 text-xs font-bold text-[#ff9bc5]">
                Отменено
              </span>
            ) : (
              <span className="rounded-full bg-[#8df0b4]/15 px-2.5 py-1 text-xs font-bold text-[#8df0b4]">
                {new Date(event.starts_at) > new Date() ? "Предстоит" : "Прошло"}
              </span>
            )}
            {event.scope === "local" ? (
              <span className="rounded-full bg-[#b550ff]/20 px-2.5 py-1 text-xs font-bold text-[#e7c9f5]">
                📍 Локальное
              </span>
            ) : (
              <span className="rounded-full bg-[#7fd8ff]/15 px-2.5 py-1 text-xs font-bold text-[#7fd8ff]">
                🌎 Открытое
              </span>
            )}
          </div>
          <h2 className="mt-3 text-2xl font-bold">{event.title}</h2>
          <div className="mt-3 space-y-1.5 text-sm text-[#b9b1c5]">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4" /> {dateLabel}
            </p>
            {event.scope === "local" && event.city?.name && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4" /> {event.city.name}
              </p>
            )}
          </div>
          <p className="mt-4 text-sm text-[#c5bdd0]">
            Автор:{" "}
            {author ? (
              <Link
                className="font-semibold text-[#e3a3d5]"
                href={`/u/${author.username}` as Route}
              >
                {author.display_name}
              </Link>
            ) : (
              "Пользователь"
            )}
          </p>
          {event.description && (
            <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white/5 p-3 text-sm leading-6 text-[#d8d0e0]">
              {event.description}
            </p>
          )}
          <div className="mt-5 flex items-center gap-2">
            <UsersRound className="size-5 text-[#d68cff]" />
            <b>{attendeeList.length}</b>
            <span className="text-sm text-[#b9b1c5]">участников</span>
          </div>
          {!event.is_cancelled && (
            <div className="mt-4">
              {isAuthor ? (
                <form action={cancelEvent}>
                  <input name="event_id" type="hidden" value={event.id} />
                  <button
                    className="w-full rounded-xl border border-[#ff5b99]/40 bg-[#2a1222] py-3 text-sm font-bold text-[#ff9bc5]"
                    type="submit"
                  >
                    Отменить событие
                  </button>
                </form>
              ) : isJoined ? (
                <form action={leaveEvent}>
                  <input name="event_id" type="hidden" value={event.id} />
                  <button
                    className="w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-bold"
                    type="submit"
                  >
                    Покинуть
                  </button>
                </form>
              ) : (
                <form action={joinEvent}>
                  <input name="event_id" type="hidden" value={event.id} />
                  <button
                    className="w-full rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] py-3 text-sm font-bold"
                    type="submit"
                  >
                    Присоединиться
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </article>

      {attendeeList.length > 0 && (
        <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
          <h3 className="font-bold">Участники</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {attendeeList.map((attendee) => (
              <span
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
                key={attendee.profileId}
              >
                {attendee.name}
                {attendee.profileId === event.author_id ? " 👑" : ""}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
