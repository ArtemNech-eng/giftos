import Link from "next/link";
import type { Route } from "next";
/* eslint-disable @next/next/no-img-element -- short-lived signed avatar URLs */
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Flame,
  MapPin,
  Pin,
  Plus,
  Radio,
  Sparkles,
  Store,
  TrendingUp,
  Trophy,
  UsersRound,
} from "lucide-react";

import { CityPulse, type CityPulseItem } from "@/components/city-pulse";
import { CityPulseRefresh } from "@/components/city-pulse-refresh";
import { LocalRoleIcon } from "@/components/local-role-icon";
import { PlaceIcon } from "@/components/place-icon";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";

export const metadata = {
  title: "Город",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const ONLINE_WINDOW = 15 * 60 * 1000; // 15 minutes soft online

type PlaceRow = {
  id: string;
  name: string;
  description: string | null;
  icon_code: string;
  kind: "fixed" | "personal" | "temporary";
  creator_id: string | null;
  promoted_until: string | null;
  pinned_until: string | null;
};

type CirclePerson = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type CityEventPreview = {
  id: string;
  title: string;
  startsAt: string;
  eventType: string;
};

type LocalCreatorPreview = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  roleCode: string;
  cityLabel: string | null;
  headline: string | null;
  liveSlug: string | null;
  liveTitle: string | null;
  storyId: string | null;
  eventId: string | null;
  eventTitle: string | null;
};

const avatarGradients = [
  "from-[#ff78ad] to-[#ffc479]",
  "from-[#8e6cff] to-[#e968df]",
  "from-[#4bc7c2] to-[#78a5ff]",
  "from-[#ff9c65] to-[#e65a99]",
];

function CircleAvatar({ person, index }: { person: CirclePerson; index: number }) {
  return (
    <span
      className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br p-0.5 ${avatarGradients[index % avatarGradients.length]}`}
    >
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f7f1fa] text-xs font-black text-[#33263d]">
        {person.avatarUrl ? (
          <img
            loading="lazy"
            decoding="async"
            alt=""
            className="size-full object-cover"
            src={person.avatarUrl}
          />
        ) : (
          person.displayName.slice(0, 1).toUpperCase()
        )}
      </span>
    </span>
  );
}

export default async function PlacesPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city, display_name")
    .eq("id", user.id)
    .maybeSingle();

  let places: Array<PlaceRow & { online: number; friends: number; unread: number }> =
    [];
  let cityName: string | null = null;
  let cityPulse: CityPulseItem[] = [];
  let cityCircle: CirclePerson[] = [];
  let onlinePeopleCount = 0;
  let alivePlacesCount = 0;
  let cityEvents: CityEventPreview[] = [];
  let localCreators: LocalCreatorPreview[] = [];
  if (profile?.city_id) {
    const { data: cityRow } = await supabase
      .from("cities")
      .select("name")
      .eq("id", profile.city_id)
      .maybeSingle();
    cityName = cityRow?.name ?? profile.city ?? null;

    const { data: rawPulse } = await supabase
      .from("public_city_pulse")
      .select(
        "city_id, kind, actor_id, actor_name, actor_username, actor_avatar_path, target_id, target_name, target_emoji, target_slug, created_at",
      )
      .eq("city_id", profile.city_id)
      .order("created_at", { ascending: false })
      .limit(8);
    const pulseRows = (rawPulse ?? []) as Array<{
      city_id: string;
      kind: CityPulseItem["kind"];
      actor_id: string;
      actor_name: string;
      actor_username: string;
      actor_avatar_path: string | null;
      target_id: string;
      target_name: string;
      target_emoji: string;
      target_slug: string | null;
      created_at: string;
    }>;
    const { data: rawSocialMoments } = await supabase
      .from("public_city_social_moments")
      .select(
        "city_id, kind, actor_id, actor_name, actor_username, actor_avatar_path, target_id, target_name, target_slug, created_at",
      )
      .eq("city_id", profile.city_id)
      .order("created_at", { ascending: false })
      .limit(8);
    const socialRows = (rawSocialMoments ?? []) as Array<{
      city_id: string;
      kind: CityPulseItem["kind"];
      actor_id: string;
      actor_name: string;
      actor_username: string;
      actor_avatar_path: string | null;
      target_id: string | null;
      target_name: string;
      target_slug: string | null;
      created_at: string;
    }>;
    const allPulseRows = [
      ...pulseRows,
      ...socialRows.map((item) => ({ ...item, target_emoji: "" })),
    ].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    cityPulse = await Promise.all(
      allPulseRows.slice(0, 8).map(async (item) => ({
        city_id: item.city_id,
        kind: item.kind,
        actor_id: item.actor_id,
        actor_name: item.actor_name,
        actor_username: item.actor_username,
        actor_avatar_url: await getSignedImageUrl({
          bucket: "avatars",
          path: item.actor_avatar_path,
        }),
        target_id: item.target_id ?? item.actor_id,
        target_name: item.target_name,
        target_emoji: item.target_emoji,
        target_slug: item.target_slug,
        created_at: item.created_at,
      })),
    );

    // When the user last read each place (for the unread badge).
    const { data: myPresence } = await supabase
      .from("place_presence")
      .select("place_id, last_read_at")
      .eq("profile_id", user.id);
    const myLastRead = new Map<string, string>(
      (myPresence ?? []).map((row) => [row.place_id, row.last_read_at]),
    );

    const { data: rawPlaces } = await supabase
      .from("places")
      .select(
        "id, name, description, icon_code, kind, creator_id, promoted_until, pinned_until",
      )
      .eq("city_id", profile.city_id)
      .eq("is_active", true)
      .order("pinned_until", { ascending: false, nullsFirst: false })
      .order("promoted_until", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(100);
    const rows = (rawPlaces ?? []) as PlaceRow[];

    // Unread messages per place (after the user's last read).
    const unreadByPlace = new Map<string, number>();
    const readPlaces = rows.filter((row) => myLastRead.has(row.id));
    if (readPlaces.length > 0) {
      const { data: rawUnread } = await supabase
        .from("place_messages")
        .select("place_id, created_at")
        .in(
          "place_id",
          readPlaces.map((row) => row.id),
        );
      for (const message of rawUnread ?? []) {
        const lastRead = myLastRead.get(message.place_id);
        if (lastRead && new Date(message.created_at) > new Date(lastRead)) {
          unreadByPlace.set(
            message.place_id,
            (unreadByPlace.get(message.place_id) ?? 0) + 1,
          );
        }
      }
    }

    const cutoff = new Date(Date.now() - ONLINE_WINDOW).toISOString();
    const [{ data: presence }, { data: members }, { data: myFollows }] =
      await Promise.all([
        supabase
          .from("place_presence")
          .select("place_id, profile_id")
          .gte("last_seen_at", cutoff),
        supabase.from("place_members").select("place_id, profile_id"),
        supabase.from("user_follows").select("following_id").eq("follower_id", user.id),
      ]);
    const followed = new Set((myFollows ?? []).map((row) => row.following_id));
    const onlineByPlace = new Map<string, number>();
    const friendsByPlace = new Map<string, number>();
    for (const row of presence ?? []) {
      onlineByPlace.set(row.place_id, (onlineByPlace.get(row.place_id) ?? 0) + 1);
      if (followed.has(row.profile_id))
        friendsByPlace.set(row.place_id, (friendsByPlace.get(row.place_id) ?? 0) + 1);
    }
    const memberSet = new Set(
      (members ?? []).map((row) => `${row.place_id}:${row.profile_id}`),
    );
    places = rows.map((place) => ({
      ...place,
      online: onlineByPlace.get(place.id) ?? 0,
      friends: friendsByPlace.get(place.id) ?? 0,
      joined: memberSet.has(`${place.id}:${user.id}`),
      unread: unreadByPlace.get(place.id) ?? 0,
    }));

    const cityPlaceIds = new Set(rows.map((place) => place.id));
    const cityPresence = (presence ?? []).filter((row) =>
      cityPlaceIds.has(row.place_id),
    );
    const onlineIds = [...new Set(cityPresence.map((row) => row.profile_id))];
    onlinePeopleCount = onlineIds.length;
    alivePlacesCount = places.filter((place) => place.online > 0).length;

    // Prefer people the user follows: this makes the city feel like a personal
    // circle first, then falls back to other public residents who are online.
    const circleIds = [
      ...onlineIds.filter((id) => followed.has(id)),
      ...onlineIds.filter((id) => !followed.has(id)),
    ].slice(0, 8);
    if (circleIds.length > 0) {
      const { data: rawCircle } = await supabase
        .from("public_city_people")
        .select("id, username, display_name, avatar_path")
        .eq("city_id", profile.city_id)
        .in("id", circleIds);
      const circleById = new Map(
        (rawCircle ?? []).map((person) => [person.id, person]),
      );
      cityCircle = await Promise.all(
        circleIds
          .flatMap((id) => {
            const person = circleById.get(id);
            return person ? [person] : [];
          })
          .map(async (person) => ({
            id: person.id,
            username: person.username,
            displayName: person.display_name,
            avatarUrl: await getSignedImageUrl({
              bucket: "avatars",
              path: person.avatar_path,
            }),
          })),
      );
    }

    const { data: rawEvents } = await supabase
      .from("events")
      .select("id, title, starts_at, event_type")
      .eq("city_id", profile.city_id)
      .eq("is_cancelled", false)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(2);
    cityEvents = (rawEvents ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      startsAt: event.starts_at,
      eventType: event.event_type,
    }));

    const { data: rawLocalCreators } = await supabase
      .from("public_local_creators")
      .select(
        "id, username, display_name, avatar_path, role_code, city_label, headline, live_slug, live_title, story_id, event_id, event_title",
      )
      .eq("city_id", profile.city_id)
      .order("updated_at", { ascending: false })
      .limit(8);
    localCreators = await Promise.all(
      (
        (rawLocalCreators ?? []) as Array<{
          id: string;
          username: string;
          display_name: string;
          avatar_path: string | null;
          role_code: string;
          city_label: string | null;
          headline: string | null;
          live_slug: string | null;
          live_title: string | null;
          story_id: string | null;
          event_id: string | null;
          event_title: string | null;
        }>
      ).map(async (creator) => ({
        id: creator.id,
        username: creator.username,
        displayName: creator.display_name,
        avatarUrl: await getSignedImageUrl({
          bucket: "avatars",
          path: creator.avatar_path,
        }),
        roleCode: creator.role_code,
        cityLabel: creator.city_label,
        headline: creator.headline,
        liveSlug: creator.live_slug,
        liveTitle: creator.live_title,
        storyId: creator.story_id,
        eventId: creator.event_id,
        eventTitle: creator.event_title,
      })),
    );
  }

  const now = Date.now();
  const sorted = [...places].sort((a, b) => {
    const aPinned = a.pinned_until && new Date(a.pinned_until).getTime() > now;
    const bPinned = b.pinned_until && new Date(b.pinned_until).getTime() > now;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    const aPromoted = a.promoted_until && new Date(a.promoted_until).getTime() > now;
    const bPromoted = b.promoted_until && new Date(b.promoted_until).getTime() > now;
    if (aPromoted !== bPromoted) return aPromoted ? -1 : 1;
    return b.online - a.online;
  });

  // «Who rose this week» — top rising users of the city.
  let risingUsers: Array<{
    profile_id: string;
    display_name: string;
    username: string;
    rank: number;
  }> = [];
  if (profile?.city_id) {
    const { data: rawRising } = await supabase
      .from("public_city_rankings")
      .select("profile_id, display_name, username, rank")
      .eq("city_id", profile.city_id)
      .eq("category", "rising")
      .order("rank", { ascending: true })
      .limit(3);
    risingUsers = (rawRising ?? []) as typeof risingUsers;
  }

  // Growth sections (plan item 7): «Popular places» (real 7-day activity)
  // and «New places» (recently created) in the user's city.
  type PopularPlaceRow = {
    id: string;
    name: string;
    description: string | null;
    icon_code: string | null;
    kind: string;
    activity_score: number;
  };
  let popularPlaces: PopularPlaceRow[] = [];
  let newPlaces: PopularPlaceRow[] = [];
  if (profile?.city_id) {
    const [{ data: rawPopular }, { data: rawNew }] = await Promise.all([
      supabase
        .from("public_popular_places")
        .select("id, name, description, icon_code, kind, activity_score")
        .eq("city_id", profile.city_id)
        .limit(6),
      supabase
        .from("places")
        .select("id, name, description, icon_code, kind")
        .eq("city_id", profile.city_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4),
    ]);
    popularPlaces = ((rawPopular ?? []) as PopularPlaceRow[]).filter(
      (place) => place.activity_score > 0,
    );
    newPlaces = (rawNew ?? []) as PopularPlaceRow[];
  }

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-24 pt-5 text-[#251d31]">
      <CityPulseRefresh cityId={profile?.city_id} />
      <header className="flex items-center justify-between">
        <Link
          className="inline-flex items-center gap-2 text-xs font-bold text-[#756a7d]"
          href="/feed"
        >
          ← Главная
        </Link>
        <span className="flex items-center gap-1.5 text-sm font-black">
          <MapPin className="size-4 text-[#8753e6]" /> {cityName ?? "Город"}
        </span>
        <Link
          aria-label="Создать место"
          className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-white shadow-[0_7px_16px_rgba(160,75,213,.24)]"
          href="/places/new"
        >
          <Plus className="size-5" />
        </Link>
      </header>

      <Link
        className="mt-4 flex items-center justify-between rounded-2xl border border-[#e6d9ef] bg-white p-3.5 shadow-[0_6px_16px_rgba(69,43,94,.05)]"
        href="/services"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#fff6e8] text-[#a87511]">
            <Store className="size-4.5" />
          </span>
          <span>
            <b className="block text-xs">Услуги и заведения города</b>
            <small className="mt-0.5 block text-[10px] text-[#81748a]">
              Мастера и точки рядом
            </small>
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-[#a295a8]" />
      </Link>

      {!profile?.city_id ? (
        <section className="mt-12 rounded-[1.8rem] border border-[#d9c5f3] bg-gradient-to-br from-[#fffaff] to-[#f2ecff] p-6 text-center shadow-[0_12px_30px_rgba(69,43,94,.07)]">
          <MapPin className="mx-auto size-8 text-[#8753e6]" />
          <h1 className="mt-4 text-2xl font-black tracking-[-0.06em]">
            Твой город ещё не выбран
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#756a7d]">
            Выбери город — и здесь появятся свои люди, живые места, разговоры и события.
          </p>
          <Link
            className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-3 text-sm font-black text-white"
            href="/onboarding"
          >
            Выбрать город
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#2e2250] via-[#4d3572] to-[#7559d5] p-5 text-white shadow-[0_14px_32px_rgba(63,37,98,.22)]">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffc3da]">
              Город сейчас
            </p>
            <h1 className="mt-2 text-3xl font-black leading-[0.9] tracking-[-0.075em]">
              {cityName}
              <br />
              не спит.
            </h1>
            <p className="mt-3 max-w-64 text-[11px] leading-5 text-white/75">
              Заходи туда, где сейчас твои люди — не листай город со стороны.
            </p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black">
                {onlinePeopleCount} сейчас здесь
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black">
                {alivePlacesCount} живых мест
              </span>
            </div>
          </section>

          {(popularPlaces.length > 0 || newPlaces.length > 0) && (
            <section className="mt-6">
              {popularPlaces.length > 0 && (
                <div>
                  <div className="mb-3 flex items-end justify-between">
                    <span>
                      <h2 className="flex items-center gap-2 text-sm font-black">
                        <Flame className="size-4 text-[#e2574c]" /> Популярные сейчас
                      </h2>
                      <p className="mt-0.5 text-[10px] text-[#81748a]">
                        Живые разговоры за неделю — из реальной активности
                      </p>
                    </span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {popularPlaces.map((place) => (
                      <Link
                        className="w-36 shrink-0 rounded-2xl border border-[#2c2036]/10 bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                        href={`/places/${place.id}` as Route}
                        key={`popular-${place.id}`}
                      >
                        <span className="grid size-9 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
                          <PlaceIcon className="size-4.5" code={place.icon_code} />
                        </span>
                        <b className="mt-3 block truncate text-[11px]">{place.name}</b>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#ffe9ef] px-2 py-0.5 text-[8px] font-black text-[#d84b81]">
                          <Flame className="size-2.5" /> {place.activity_score}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {newPlaces.length > 0 && (
                <div className={popularPlaces.length > 0 ? "mt-5" : ""}>
                  <div className="mb-3 flex items-end justify-between">
                    <span>
                      <h2 className="flex items-center gap-2 text-sm font-black">
                        <Sparkles className="size-4 text-[#8753e6]" /> Новые места
                      </h2>
                      <p className="mt-0.5 text-[10px] text-[#81748a]">
                        Куда можно зайти первым
                      </p>
                    </span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {newPlaces.map((place) => (
                      <Link
                        className="w-36 shrink-0 rounded-2xl border border-[#2c2036]/10 bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                        href={`/places/${place.id}` as Route}
                        key={`new-${place.id}`}
                      >
                        <span className="grid size-9 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
                          <PlaceIcon className="size-4.5" code={place.icon_code} />
                        </span>
                        <b className="mt-3 block truncate text-[11px]">{place.name}</b>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#f0e9ff] px-2 py-0.5 text-[8px] font-black text-[#7549d0]">
                          <Sparkles className="size-2.5" /> Новое
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {cityCircle.length > 0 && (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <span>
                  <h2 className="text-sm font-black">Свои сейчас здесь</h2>
                  <p className="mt-0.5 text-[10px] text-[#81748a]">
                    Люди, за которыми ты следишь, и жители города
                  </p>
                </span>
                <Link className="text-[10px] font-black text-[#8753e6]" href="/people">
                  Все люди ›
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {cityCircle.map((person, index) => (
                  <Link
                    className="flex w-14 shrink-0 flex-col items-center gap-1.5"
                    href={`/u/${person.username}` as Route}
                    key={person.id}
                  >
                    <CircleAvatar index={index} person={person} />
                    <span className="w-14 truncate text-center text-[10px] font-bold">
                      {person.displayName}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {localCreators.length > 0 && (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <span>
                  <h2 className="text-sm font-black">Создают в городе</h2>
                  <p className="mt-0.5 text-[10px] text-[#81748a]">
                    Люди, которых можно смотреть и поддерживать среди своих
                  </p>
                </span>
                <Link className="text-[10px] font-black text-[#8753e6]" href="/local">
                  Моя витрина ›
                </Link>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {localCreators.slice(0, 6).map((creator, index) => {
                  const contentHref = creator.liveSlug
                    ? (`/live/${creator.liveSlug}` as Route)
                    : creator.storyId
                      ? (`/stories/${creator.storyId}` as Route)
                      : creator.eventId
                        ? (`/events/${creator.eventId}` as Route)
                        : (`/u/${creator.username}` as Route);
                  const state = creator.liveSlug
                    ? "В эфире"
                    : creator.storyId
                      ? "Новая story"
                      : creator.eventId
                        ? "Событие"
                        : "В городе";
                  return (
                    <Link
                      className="w-36 shrink-0 rounded-2xl border border-[#2c2036]/10 bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                      href={contentHref}
                      key={creator.id}
                    >
                      <div className="flex items-center gap-2">
                        <CircleAvatar index={index} person={creator} />
                        <LocalRoleIcon
                          className="size-4 text-[#8753e6]"
                          code={creator.roleCode}
                        />
                      </div>
                      <b className="mt-3 block truncate text-[11px]">
                        {creator.displayName}
                      </b>
                      <span className="mt-1 flex items-center gap-1 text-[9px] font-bold text-[#8753e6]">
                        {state === "В эфире" && <Radio className="size-2.5" />}
                        {state}
                      </span>
                      <small className="mt-1 line-clamp-2 block min-h-7 text-[9px] leading-3 text-[#81748a]">
                        {creator.cityLabel ??
                          creator.headline ??
                          creator.eventTitle ??
                          creator.liveTitle ??
                          "Показывает себя в городе"}
                      </small>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {cityName && <CityPulse cityName={cityName} items={cityPulse} />}

          {(cityEvents.length > 0 ||
            cityPulse.some((item) => item.kind === "live")) && (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-black">Сегодня в городе</h2>
                <Link className="text-[10px] font-black text-[#8753e6]" href="/events">
                  Все события ›
                </Link>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {cityPulse
                  .filter((item) => item.kind === "live")
                  .slice(0, 2)
                  .map((item) => (
                    <Link
                      className="w-44 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#fff0f6] to-[#f0eaff] p-3"
                      href={
                        item.target_slug
                          ? (`/live/${item.target_slug}` as Route)
                          : "/feed"
                      }
                      key={`live-${item.target_id}`}
                    >
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#ff3f79] px-1.5 py-0.5 text-[8px] font-black text-white">
                        <Radio className="size-2.5" /> LIVE
                      </span>
                      <b className="mt-6 block truncate text-[11px]">
                        {item.target_name}
                      </b>
                      <small className="mt-1 block truncate text-[10px] text-[#756a7d]">
                        {item.actor_name}
                      </small>
                    </Link>
                  ))}
                {cityEvents.map((event) => (
                  <Link
                    className="w-44 shrink-0 rounded-2xl bg-gradient-to-br from-[#eef7f6] to-[#ecf0ff] p-3"
                    href={`/events/${event.id}` as Route}
                    key={event.id}
                  >
                    <CalendarDays className="size-5 text-[#258b82]" />
                    <b className="mt-5 block truncate text-[11px]">{event.title}</b>
                    <small className="mt-1 block text-[10px] text-[#6d7a80]">
                      {new Intl.DateTimeFormat("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(event.startsAt))}
                    </small>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <span>
                <h2 className="text-sm font-black">Куда зайдём?</h2>
                <p className="mt-0.5 text-[10px] text-[#81748a]">
                  Места, где есть разговор или свои люди
                </p>
              </span>
              <Link
                className="text-[10px] font-black text-[#8753e6]"
                href="/places/new"
              >
                Создать ›
              </Link>
            </div>
            {sorted.length === 0 ? (
              <Link
                className="block rounded-[1.6rem] border border-dashed border-[#2c2036]/20 bg-white/70 p-5 text-center"
                href="/places/new"
              >
                <PlaceIcon className="mx-auto size-7 text-[#8753e6]" code="place" />
                <b className="mt-3 block text-sm">Собери первое место</b>
                <span className="mt-1 block text-[11px] leading-5 text-[#7b7083]">
                  Не обязан быть там один — позови своих в городскую тусовку.
                </span>
              </Link>
            ) : (
              <div className="space-y-2.5">
                {sorted.slice(0, 8).map((place) => (
                  <Link
                    className="flex items-center gap-3 rounded-2xl border border-[#2c2036]/10 bg-white p-3.5 shadow-[0_6px_18px_rgba(69,43,94,.05)] transition hover:-translate-y-0.5 hover:border-[#9c6ce7]/35"
                    href={`/places/${place.id}` as Route}
                    key={place.id}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f3e8ff] to-[#fff1f7] text-[#8753e6]">
                      <PlaceIcon className="size-5" code={place.icon_code} />
                    </span>
                    <span className="min-w-0 grow">
                      <span className="flex items-center gap-1.5">
                        <b className="truncate text-[12px]">{place.name}</b>
                        {place.pinned_until &&
                          new Date(place.pinned_until).getTime() > now && (
                            <Pin className="size-3.5 text-[#d84b81]" />
                          )}
                        {place.promoted_until &&
                          new Date(place.promoted_until).getTime() > now && (
                            <TrendingUp className="size-3.5 text-[#a87511]" />
                          )}
                      </span>
                      <span className="mt-1 flex items-center gap-2.5 text-[10px] text-[#7b7083]">
                        <span className="inline-flex items-center gap-1">
                          <UsersRound className="size-3" /> {place.online} сейчас
                        </span>
                        {place.friends > 0 && <span>свои: {place.friends}</span>}
                        {place.unread > 0 && (
                          <span className="inline-flex items-center gap-1 font-bold text-[#d84b81]">
                            <Bell className="size-3" /> {place.unread}
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-[#aa9eaf]" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {risingUsers.length > 0 && (
            <section className="mt-6 rounded-2xl border border-[#ffe0aa] bg-[#fff8e9] p-4">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-[#a87511]" />
                <h2 className="text-sm font-black">В движении на этой неделе</h2>
              </div>
              <div className="mt-3 space-y-2">
                {risingUsers.map((person, index) => (
                  <Link
                    className="flex items-center gap-2"
                    href={`/u/${person.username}` as Route}
                    key={person.profile_id}
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-white text-[10px] font-black text-[#a87511]">
                      {index + 1}
                    </span>
                    <span className="grow truncate text-[11px] font-bold">
                      {person.display_name}
                    </span>
                    <span className="text-[10px] font-black text-[#a87511]">
                      #{person.rank}
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                className="mt-3 flex items-center justify-end gap-1 text-[10px] font-black text-[#a87511]"
                href="/city/rankings"
              >
                Все рейтинги <ChevronRight className="size-3.5" />
              </Link>
            </section>
          )}
        </>
      )}
    </main>
  );
}
