import Link from "next/link";
import type { Route } from "next";
/* eslint-disable @next/next/no-img-element -- avatar paths use short-lived signed Storage URLs */
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  MapPin,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";

import { EventTypeIcon, getEventTypeLabel } from "@/components/event-type-icon";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";

export const metadata = {
  title: "События города",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type CityRow = { id: string; name: string };
type EventRow = {
  id: string;
  author_id: string;
  city_id: string | null;
  place_id: string | null;
  title: string;
  description: string | null;
  event_type: string;
  scope: "local" | "open";
  starts_at: string;
  cities: CityRow | CityRow[] | null;
};
type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
};
type PlaceRow = { id: string; name: string; icon_code: string | null };
type EventCard = {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startsAt: string;
  cityName: string | null;
  placeName: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  attendeeCount: number;
  joined: boolean;
  scope: "local" | "open";
};

function eventDateParts(value: string) {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat("ru-RU", { day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat("ru-RU", { month: "short" })
      .format(date)
      .replace(".", ""),
    time: new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function eventGroup(value: string) {
  const start = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(start);
  eventDay.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);
  if (dayDiff <= 0) return "today";
  if (dayDiff === 1) return "tomorrow";
  if (dayDiff < 7) return "week";
  return "later";
}

function EventAuthorAvatar({ card }: { card: EventCard }) {
  return (
    <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] p-0.5">
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f8f4fc] text-[9px] font-black text-[#372c41]">
        {card.authorAvatarUrl ? (
          <img alt="" className="size-full object-cover" src={card.authorAvatarUrl} />
        ) : (
          card.authorName.slice(0, 1).toUpperCase()
        )}
      </span>
    </span>
  );
}

function EventListCard({ card }: { card: EventCard }) {
  const date = eventDateParts(card.startsAt);
  return (
    <Link
      className="border-[#2c2036]/9 group block rounded-[1.55rem] border bg-white p-3.5 shadow-[0_9px_24px_rgba(69,43,94,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(69,43,94,.11)]"
      href={`/events/${card.id}` as Route}
    >
      <div className="flex gap-3">
        <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#f0e9ff] text-[#6e49cf]">
          <b className="text-base leading-none">{date.day}</b>
          <small className="mt-1 text-[9px] font-black uppercase">{date.month}</small>
        </span>
        <span className="min-w-0 grow">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#876f96]">
                <EventTypeIcon
                  className="size-3.5 text-[#8753e6]"
                  type={card.eventType}
                />
                {getEventTypeLabel(card.eventType)}
              </span>
              <b className="mt-1.5 block truncate text-sm tracking-[-0.025em] text-[#251d31]">
                {card.title}
              </b>
            </span>
            <ChevronRight className="mt-1 size-4 shrink-0 text-[#a597ad] transition group-hover:translate-x-0.5" />
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-[#766a7d]">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5 text-[#8753e6]" /> {date.time}
            </span>
            {card.placeName ? (
              <span className="inline-flex max-w-40 items-center gap-1 truncate">
                <MapPin className="size-3.5 shrink-0 text-[#258b82]" />
                <span className="truncate">{card.placeName}</span>
              </span>
            ) : card.cityName ? (
              <span className="inline-flex max-w-36 items-center gap-1 truncate">
                <MapPin className="size-3.5 shrink-0 text-[#258b82]" />
                <span className="truncate">{card.cityName}</span>
              </span>
            ) : (
              <span className="rounded-full bg-[#f1ecf6] px-2 py-0.5 text-[9px] text-[#7d6f87]">
                Открытое
              </span>
            )}
          </span>
        </span>
      </div>
      <div className="border-[#2c2036]/7 mt-3 flex items-center justify-between gap-3 border-t pt-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <EventAuthorAvatar card={card} />
          <span className="truncate text-[10px] font-bold text-[#685c70]">
            {card.authorName}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold text-[#756a7d]">
          {card.joined ? (
            <>
              <Check className="size-3.5 text-[#258b82]" /> Ты идёшь
            </>
          ) : (
            <>
              <UsersRound className="size-3.5 text-[#8753e6]" /> {card.attendeeCount}
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

function EventGroup({
  title,
  subtitle,
  cards,
}: {
  title: string;
  subtitle: string;
  cards: EventCard[];
}) {
  if (cards.length === 0) return null;
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <span>
          <h2 className="text-sm font-black tracking-[-0.025em]">{title}</h2>
          <p className="mt-0.5 text-[10px] text-[#82758a]">{subtitle}</p>
        </span>
        <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
          {cards.length}
        </span>
      </div>
      <div className="space-y-2.5">
        {cards.map((card) => (
          <EventListCard card={card} key={card.id} />
        ))}
      </div>
    </section>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; q?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const { city: rawCity = "my", q: rawQuery = "" } = await searchParams;
  const cityOnly = rawCity !== "all";
  const query = rawQuery.trim().slice(0, 80);

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();

  const eventsQuery = supabase
    .from("events")
    .select(
      "id, author_id, city_id, place_id, title, description, event_type, scope, starts_at, cities!left(id, name)",
    )
    .eq("is_cancelled", false)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(100);
  const { data: rawEvents } = cityOnly
    ? profile?.city_id
      ? await eventsQuery.eq("city_id", profile.city_id)
      : { data: [] }
    : await eventsQuery;

  let eventRows = (rawEvents ?? []) as unknown as EventRow[];
  if (query) {
    const lower = query.toLocaleLowerCase("ru-RU");
    eventRows = eventRows.filter((event) => {
      const city = Array.isArray(event.cities) ? event.cities[0] : event.cities;
      return [event.title, event.description ?? "", city?.name ?? ""]
        .join(" ")
        .toLocaleLowerCase("ru-RU")
        .includes(lower);
    });
  }

  const eventIds = eventRows.map((event) => event.id);
  const authorIds = [...new Set(eventRows.map((event) => event.author_id))];
  const placeIds = [
    ...new Set(eventRows.flatMap((event) => (event.place_id ? [event.place_id] : []))),
  ];
  const [attendanceResult, authorsResult, placesResult] = await Promise.all([
    eventIds.length > 0
      ? supabase
          .from("event_attendees")
          .select("event_id, profile_id")
          .in("event_id", eventIds)
      : Promise.resolve({
          data: [] as Array<{ event_id: string; profile_id: string }>,
        }),
    authorIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, username, display_name, avatar_path")
          .in("id", authorIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    placeIds.length > 0
      ? supabase.from("places").select("id, name, icon_code").in("id", placeIds)
      : Promise.resolve({ data: [] as PlaceRow[] }),
  ]);

  const attendance = (attendanceResult.data ?? []) as Array<{
    event_id: string;
    profile_id: string;
  }>;
  const attendeesByEvent = new Map<string, number>();
  const joinedEventIds = new Set<string>();
  for (const attendee of attendance) {
    attendeesByEvent.set(
      attendee.event_id,
      (attendeesByEvent.get(attendee.event_id) ?? 0) + 1,
    );
    if (attendee.profile_id === user.id) joinedEventIds.add(attendee.event_id);
  }
  const authorsById = new Map(
    ((authorsResult.data ?? []) as ProfileRow[]).map((author) => [author.id, author]),
  );
  const placesById = new Map(
    ((placesResult.data ?? []) as PlaceRow[]).map((place) => [place.id, place]),
  );

  const cards: EventCard[] = await Promise.all(
    eventRows.map(async (event) => {
      const city = Array.isArray(event.cities)
        ? (event.cities[0] ?? null)
        : event.cities;
      const author = authorsById.get(event.author_id);
      const place = event.place_id ? placesById.get(event.place_id) : null;
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.event_type,
        startsAt: event.starts_at,
        cityName: city?.name ?? null,
        placeName: place?.name ?? null,
        authorName: author?.display_name ?? "Автор события",
        authorAvatarUrl: await getSignedImageUrl({
          bucket: "avatars",
          path: author?.avatar_path ?? null,
        }),
        attendeeCount: attendeesByEvent.get(event.id) ?? 0,
        joined: joinedEventIds.has(event.id),
        scope: event.scope,
      };
    }),
  );

  const groups = {
    today: cards.filter((card) => eventGroup(card.startsAt) === "today"),
    tomorrow: cards.filter((card) => eventGroup(card.startsAt) === "tomorrow"),
    week: cards.filter((card) => eventGroup(card.startsAt) === "week"),
    later: cards.filter((card) => eventGroup(card.startsAt) === "later"),
  };
  const cityName = profile?.city ?? "Твой город";
  const hasCity = Boolean(profile?.city_id);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться в город"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/places"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Программа города
          </small>
          <h1 className="mt-0.5 text-sm font-black">События</h1>
        </span>
        <Link
          aria-label="Создать событие"
          className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-white shadow-[0_7px_16px_rgba(160,75,213,.24)]"
          href="/events/new"
        >
          <Plus className="size-5" />
        </Link>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#332357] via-[#59407f] to-[#8470dd] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <CalendarDays className="size-3.5" /> Городская сцена
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          {cityOnly && hasCity ? (
            <>
              Планы
              <br />
              {cityName}.
            </>
          ) : (
            <>
              Выйти
              <br />к своим.
            </>
          )}
        </h2>
        <p className="max-w-68 mt-3 text-[11px] leading-5 text-white/75">
          Встречи, прогулки, музыка и эфиры, которые люди открыли для города.
        </p>
        <div className="text-white/82 mt-5 flex items-center gap-2 text-[10px] font-bold">
          <span className="size-2 rounded-full bg-[#63d9ad] shadow-[0_0_0_4px_rgba(99,217,173,.13)]" />
          Только реальные публичные планы
        </div>
      </section>

      <nav className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-[#ebe5f1] p-1 text-center text-[10px] font-black">
        <Link
          className={`rounded-xl px-2 py-2.5 transition ${
            cityOnly
              ? "bg-white text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]"
              : "text-[#82758a]"
          }`}
          href="/events?city=my"
        >
          {hasCity ? cityName : "Мой город"}
        </Link>
        <Link
          className={`rounded-xl px-2 py-2.5 transition ${
            !cityOnly
              ? "bg-white text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]"
              : "text-[#82758a]"
          }`}
          href="/events?city=all"
        >
          Вся платформа
        </Link>
      </nav>

      <form className="border-[#2c2036]/9 mt-4 flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 shadow-[0_5px_15px_rgba(69,43,94,.04)]">
        <Search className="size-4 shrink-0 text-[#8d7f96]" />
        <input name="city" type="hidden" value={cityOnly ? "my" : "all"} />
        <input
          aria-label="Поиск событий"
          className="min-w-0 grow bg-transparent py-2 text-xs font-medium outline-none placeholder:text-[#a99eae]"
          defaultValue={query}
          maxLength={80}
          name="q"
          placeholder="Найти планы или город…"
        />
        <button
          aria-label="Искать"
          className="grid size-8 place-items-center rounded-xl bg-[#f2ecfa] text-[#7549d0]"
          type="submit"
        >
          <Search className="size-3.5" />
        </button>
      </form>

      {!hasCity && cityOnly ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <MapPin className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            Сначала выбери город
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            Тогда здесь появится программа мест, людей и событий рядом с тобой.
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2.5 text-xs font-black text-white"
            href="/onboarding"
          >
            <MapPin className="size-4" /> Выбрать город
          </Link>
        </section>
      ) : cards.length === 0 ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <CalendarDays className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            {query ? "По этому запросу тихо" : "Программа только собирается"}
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            {query
              ? `Пока не нашли событие по запросу «${query}».`
              : "Первое настоящее событие станет поводом собрать своих — без выдуманной активности."}
          </p>
          {!query && (
            <Link
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2.5 text-xs font-black text-white"
              href="/events/new"
            >
              <Plus className="size-4" /> Создать событие
            </Link>
          )}
        </section>
      ) : (
        <>
          <EventGroup
            cards={groups.today}
            subtitle="То, ради чего стоит выйти сегодня"
            title="Сегодня"
          />
          <EventGroup
            cards={groups.tomorrow}
            subtitle="Можно договориться заранее"
            title="Завтра"
          />
          <EventGroup
            cards={groups.week}
            subtitle="Следующие дни города"
            title="На этой неделе"
          />
          <EventGroup
            cards={groups.later}
            subtitle="Чтобы не потерять"
            title="Дальше"
          />
        </>
      )}
    </main>
  );
}
