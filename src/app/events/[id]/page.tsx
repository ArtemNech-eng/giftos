import Link from "next/link";
import type { Route } from "next";
/* eslint-disable @next/next/no-img-element -- avatar paths use short-lived signed Storage URLs */
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe2,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { notFound } from "next/navigation";

import { cancelEvent, joinEvent, leaveEvent } from "@/app/events/actions";
import { promoteTarget } from "@/app/shop/actions";
import { EventSceneRefresh } from "@/components/event-scene-refresh";
import { EventTypeIcon, getEventTypeLabel } from "@/components/event-type-icon";
import { PlaceIcon } from "@/components/place-icon";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";

export const metadata = {
  title: "Событие",
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
  is_cancelled: boolean;
  cities: CityRow | CityRow[] | null;
};
type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
};
type PlaceRow = { id: string; name: string; icon_code: string | null };
type Attendee = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortDate(value: string) {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat("ru-RU", { day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat("ru-RU", { month: "short" })
      .format(date)
      .replace(".", ""),
  };
}

function statusCopy(value: string) {
  const now = new Date();
  const start = new Date(value);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(start);
  eventDay.setHours(0, 0, 0, 0);
  const diff = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0 && start > now) return "Сегодня";
  if (diff === 1) return "Завтра";
  if (start > now) return "Скоро";
  return "Уже началось";
}

function PersonAvatar({
  name,
  avatarUrl,
  size = "size-10",
}: {
  name: string;
  avatarUrl: string | null;
  size?: string;
}) {
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] p-0.5`}
    >
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f8f4fc] text-xs font-black text-[#372c41]">
        {avatarUrl ? (
          <img alt="" className="size-full object-cover" src={avatarUrl} />
        ) : (
          name.slice(0, 1).toUpperCase()
        )}
      </span>
    </span>
  );
}

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
      "id, author_id, city_id, place_id, title, description, event_type, scope, starts_at, is_cancelled, cities!left(id, name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!rawEvent) notFound();

  const event = rawEvent as unknown as EventRow;
  const city = Array.isArray(event.cities) ? (event.cities[0] ?? null) : event.cities;
  const [{ data: rawAuthor }, { data: rawMemberships }, placeResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_path")
        .eq("id", event.author_id)
        .maybeSingle(),
      supabase
        .from("event_attendees")
        .select("profile_id")
        .eq("event_id", event.id)
        .order("created_at", { ascending: true })
        .limit(100),
      event.place_id
        ? supabase
            .from("places")
            .select("id, name, icon_code")
            .eq("id", event.place_id)
            .maybeSingle()
        : Promise.resolve({ data: null as PlaceRow | null }),
    ]);

  const author = rawAuthor as ProfileRow | null;
  const membershipIds = (rawMemberships ?? []).map((row) => row.profile_id);
  const { data: rawAttendeeProfiles } = membershipIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_path")
        .in("id", membershipIds)
    : { data: [] as ProfileRow[] };
  const attendeesById = new Map(
    ((rawAttendeeProfiles ?? []) as ProfileRow[]).map((profile) => [
      profile.id,
      profile,
    ]),
  );
  const attendees: Attendee[] = await Promise.all(
    membershipIds
      .flatMap((profileId) => {
        const profile = attendeesById.get(profileId);
        return profile ? [profile] : [];
      })
      .map(async (profile) => ({
        id: profile.id,
        username: profile.username,
        name: profile.display_name,
        avatarUrl: await getSignedImageUrl({
          bucket: "avatars",
          path: profile.avatar_path,
        }),
      })),
  );
  const authorAvatarUrl = await getSignedImageUrl({
    bucket: "avatars",
    path: author?.avatar_path ?? null,
  });
  const place = placeResult.data as PlaceRow | null;
  const isAuthor = event.author_id === user.id;
  const isJoined = membershipIds.includes(user.id);
  const startsAt = new Date(event.starts_at);
  const isUpcoming = startsAt.getTime() > Date.now();
  const date = shortDate(event.starts_at);
  const visibleAttendees = attendees.slice(0, 5);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <EventSceneRefresh eventId={event.id} />
      <header className="flex items-center justify-between">
        <Link
          aria-label="Назад к событиям"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/events"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Городская сцена
          </small>
          <h1 className="mt-0.5 text-sm font-black">Событие</h1>
        </span>
        <span className="w-10" />
      </header>

      <article className="border-[#2c2036]/9 mt-5 overflow-hidden rounded-[1.9rem] border bg-white shadow-[0_14px_32px_rgba(69,43,94,.08)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#37275d] via-[#5c4484] to-[#8a74df] p-5 text-white">
          <div className="bg-[#f6a9cd]/18 absolute -right-7 -top-8 size-36 rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#f9d7e8]">
              <EventTypeIcon className="size-3.5" type={event.event_type} />
              {getEventTypeLabel(event.event_type)}
            </span>
            {event.is_cancelled ? (
              <span className="rounded-full bg-[#ffcbdf]/20 px-2.5 py-1 text-[9px] font-black text-[#ffe4ef]">
                Отменено
              </span>
            ) : (
              <span className="bg-[#a8f0d4]/18 rounded-full px-2.5 py-1 text-[9px] font-black text-[#d7ffe9]">
                {statusCopy(event.starts_at)}
              </span>
            )}
          </div>
          <div className="relative mt-6 flex items-end gap-3">
            <span className="bg-white/14 flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white backdrop-blur">
              <b className="text-xl leading-none">{date.day}</b>
              <small className="mt-1 text-[9px] font-black uppercase">
                {date.month}
              </small>
            </span>
            <span className="min-w-0 pb-0.5">
              <h2 className="text-2xl font-black leading-[0.95] tracking-[-0.06em]">
                {event.title}
              </h2>
              <span className="text-white/72 mt-2 flex items-center gap-1.5 text-[10px] font-bold">
                <Clock3 className="size-3.5" /> {formatDate(event.starts_at)}
              </span>
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {event.scope === "local" && city ? (
              <Link
                className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf7f5] px-2.5 py-1.5 text-[10px] font-black text-[#258b82]"
                href="/places"
              >
                <MapPin className="size-3.5" /> {city.name}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0eaff] px-2.5 py-1.5 text-[10px] font-black text-[#7549d0]">
                <Globe2 className="size-3.5" /> Открытое событие
              </span>
            )}
            {place && (
              <Link
                className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#f5f1f8] px-2.5 py-1.5 text-[10px] font-black text-[#685c70]"
                href={`/places/${place.id}` as Route}
              >
                <PlaceIcon
                  className="size-3.5 shrink-0 text-[#8753e6]"
                  code={place.icon_code}
                />
                <span className="truncate">В месте «{place.name}»</span>
                <ChevronRight className="size-3 shrink-0" />
              </Link>
            )}
          </div>

          {event.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#5f5369]">
              {event.description}
            </p>
          )}

          <Link
            className="mt-5 flex items-center gap-3 rounded-2xl bg-[#fbf8fd] p-3 transition hover:bg-[#f6f0fb]"
            href={author ? (`/u/${author.username}` as Route) : "/people"}
          >
            <PersonAvatar
              avatarUrl={authorAvatarUrl}
              name={author?.display_name ?? "Автор"}
            />
            <span className="min-w-0 grow">
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#96879f]">
                Организатор
              </span>
              <b className="mt-0.5 block truncate text-xs">
                {author?.display_name ?? "Автор события"}
              </b>
            </span>
            <ChevronRight className="size-4 text-[#9d90a4]" />
          </Link>

          <section className="border-[#2c2036]/8 mt-4 rounded-2xl border bg-[#fff] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
                  <UsersRound className="size-4" />
                </span>
                <span>
                  <b className="block text-xs">
                    {attendees.length === 0
                      ? "Пока никого"
                      : `${attendees.length} идут`}
                  </b>
                  <small className="mt-0.5 block text-[10px] text-[#81748a]">
                    Добровольно отметились на событии
                  </small>
                </span>
              </span>
              {visibleAttendees.length > 0 && (
                <span className="flex -space-x-2">
                  {visibleAttendees.map((attendee) => (
                    <PersonAvatar
                      avatarUrl={attendee.avatarUrl}
                      key={attendee.id}
                      name={attendee.name}
                      size="size-7"
                    />
                  ))}
                </span>
              )}
            </div>
          </section>

          {!event.is_cancelled && isUpcoming && (
            <div className="mt-4">
              {isAuthor ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-[#f0faf5] px-3.5 py-3 text-[#4f756b]">
                    <CheckCircle2 className="size-4 shrink-0 text-[#258b82]" />
                    <span className="text-[10px] leading-4">
                      Ты организуешь эту сцену. Люди увидят её в программе города.
                    </span>
                  </div>
                  <form action={promoteTarget}>
                    <input name="target" type="hidden" value="event" />
                    <input name="target_id" type="hidden" value={event.id} />
                    <input
                      name="return_to"
                      type="hidden"
                      value={`/events/${event.id}`}
                    />
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9c5f3] bg-[#fbf8ff] py-3 text-xs font-black text-[#7549d0]"
                      type="submit"
                    >
                      <TrendingUp className="size-4" /> Поднять в программе · 100
                      бонусов
                    </button>
                  </form>
                  <form action={cancelEvent}>
                    <input name="event_id" type="hidden" value={event.id} />
                    <button
                      className="flex w-full items-center justify-center gap-2 py-2.5 text-[10px] font-black text-[#bd5278]"
                      type="submit"
                    >
                      <X className="size-3.5" /> Отменить событие
                    </button>
                  </form>
                </div>
              ) : isJoined ? (
                <form action={leaveEvent}>
                  <input name="event_id" type="hidden" value={event.id} />
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c8e7db] bg-[#f0faf5] py-3.5 text-sm font-black text-[#258b82]"
                    type="submit"
                  >
                    <Check className="size-4.5" /> Ты идёшь · отменить
                  </button>
                </form>
              ) : (
                <form action={joinEvent}>
                  <input name="event_id" type="hidden" value={event.id} />
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.22)]"
                    type="submit"
                  >
                    <UsersRound className="size-4.5" /> Присоединиться
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </article>

      {attendees.length > 0 && (
        <section className="border-[#2c2036]/9 mt-5 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center justify-between">
            <span>
              <h2 className="text-sm font-black">Кто идёт</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Люди, которые сами отметились
              </p>
            </span>
            <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
              <UsersRound className="size-4" />
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {attendees.map((attendee) => (
              <Link
                className="flex items-center gap-3 rounded-2xl px-1 py-1 transition hover:bg-[#faf7fc]"
                href={`/u/${attendee.username}` as Route}
                key={attendee.id}
              >
                <PersonAvatar
                  avatarUrl={attendee.avatarUrl}
                  name={attendee.name}
                  size="size-9"
                />
                <span className="min-w-0 grow">
                  <b className="block truncate text-xs">{attendee.name}</b>
                  <small className="block truncate text-[10px] text-[#81748a]">
                    @{attendee.username}
                  </small>
                </span>
                {attendee.id === event.author_id && (
                  <span className="rounded-full bg-[#f0eaff] px-2 py-1 text-[8px] font-black text-[#7549d0]">
                    Автор
                  </span>
                )}
                <ChevronRight className="size-4 text-[#a295a8]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          В городской сцене видны только публичные детали события и добровольное
          участие. Личные диалоги и точная геолокация сюда не попадают.
        </p>
      </section>

      {!event.is_cancelled && !isUpcoming && (
        <section className="mt-4 flex items-center gap-2 rounded-2xl bg-[#f0eaff] p-3.5 text-[#6b55a5]">
          <Sparkles className="size-4 shrink-0" />
          <p className="text-[10px] leading-4">
            Это событие уже началось. Следи за городом — там появляются новые планы.
          </p>
        </section>
      )}
      {event.is_cancelled && (
        <section className="mt-4 flex items-center gap-2 rounded-2xl bg-[#fff1f6] p-3.5 text-[#a14e70]">
          <X className="size-4 shrink-0" />
          <p className="text-[10px] leading-4">
            Организатор отменил событие. Если ты отмечался, уведомление уже пришло в
            «Активность».
          </p>
        </section>
      )}
    </main>
  );
}
