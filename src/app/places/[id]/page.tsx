import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, CalendarDays, MapPin, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import {
  buyPlaceEmblem,
  buyPlaceTheme,
  enterPlace,
  inviteToPlace,
  joinPlace,
  leavePlace,
  pinPlaceWithBonus,
  promotePlaceWithBonus,
} from "@/app/places/actions";
import { LivePlaceChat } from "@/components/live-place-chat";
import { PlaceGiftButton } from "@/components/place-gift-button";
import { PlaceInviteButton } from "@/components/place-invite-button";
import { ReportForm } from "@/components/report-form";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Место",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const ONLINE_WINDOW = 15 * 60 * 1000;

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: place } = await supabase
    .from("places")
    .select(
      "id, city_id, creator_id, name, description, emoji, kind, created_at, popularity_score, theme_id, emblem_id, place_themes!left(gradient), place_emblems!left(emoji)",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (!place) notFound();
  const placeThemeGradient = Array.isArray(place.place_themes)
    ? (place.place_themes[0]?.gradient ?? null)
    : null;
  const placeEmblem = Array.isArray(place.place_emblems)
    ? (place.place_emblems[0]?.emoji ?? null)
    : null;

  const cutoff = new Date(Date.now() - ONLINE_WINDOW).toISOString();
  const [
    { data: presence },
    { data: messages },
    { data: member },
    { count: memberCount },
    { count: messageCount },
    { count: liveCount },
    { data: activeLive },
    { data: placeEvents },
    { data: themeCatalog },
    { data: emblemCatalog },
  ] = await Promise.all([
    supabase
      .from("place_presence")
      .select("profile_id, last_seen_at")
      .eq("place_id", id)
      .gte("last_seen_at", cutoff)
      .order("last_seen_at", { ascending: false })
      .limit(30),
    supabase
      .from("place_messages")
      .select("id, author_id, body, created_at")
      .eq("place_id", id)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("place_members")
      .select("place_id")
      .eq("place_id", id)
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("place_members")
      .select("*", { count: "exact", head: true })
      .eq("place_id", id),
    supabase
      .from("place_messages")
      .select("*", { count: "exact", head: true })
      .eq("place_id", id),
    supabase
      .from("live_rooms")
      .select("*", { count: "exact", head: true })
      .eq("place_id", id)
      .eq("status", "live"),
    supabase
      .from("live_rooms")
      .select("id, slug, title, host_id")
      .eq("place_id", id)
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("events")
      .select("id, title, starts_at")
      .eq("place_id", id)
      .eq("is_cancelled", false)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(3),
    supabase
      .from("place_themes")
      .select("id, name, gradient, price_stars")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("place_emblems")
      .select("id, name, emoji, price_stars")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);
  const online = (presence ?? []).length;
  const { data: giftCatalog } = await supabase
    .from("virtual_gifts")
    .select("code, label, emoji, price_minor")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(8);
  const { data: myInvitePlaces } = await supabase
    .from("places")
    .select("id, name, emoji")
    .eq("creator_id", user.id)
    .eq("is_active", true)
    .neq("kind", "fixed")
    .limit(20);
  const onlineIds = (presence ?? []).map((row) => row.profile_id);
  const { data: onlineProfiles } = onlineIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, is_creator")
        .in("id", onlineIds)
    : { data: [] };
  const profileById = new Map(
    (onlineProfiles ?? []).map((profile) => [profile.id, profile]),
  );
  const people = (presence ?? [])
    .map((row) => profileById.get(row.profile_id))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  const authorIds = [...new Set((messages ?? []).map((m) => m.author_id))];
  const { data: authorProfiles } = authorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", authorIds)
    : { data: [] };
  const names = new Map(
    (authorProfiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );
  // Reputation roles for chat authors (server-rendered badges).
  const authorRoles = new Map<string, string[]>();
  for (const authorId of authorIds) {
    const { data: roles } = await supabase.rpc("reputation_roles", {
      p_profile_id: authorId,
    });
    if (roles && (roles as string[]).length > 0)
      authorRoles.set(authorId, roles as string[]);
  }

  const isMember = Boolean(member);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/places"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">
          {place.emoji} {place.name} {placeEmblem ?? ""}
        </h1>
        <ReportForm
          returnTo={`/places/${place.id}`}
          targetId={place.id}
          targetType="place"
        />
      </header>

      <section
        className={`mt-5 rounded-2xl border border-white/10 p-4 ${
          placeThemeGradient
            ? `bg-gradient-to-br ${placeThemeGradient}`
            : "bg-[#171923]"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {place.kind !== "fixed" && place.creator_id && (
            <span className="rounded-full bg-[#ffd35e]/15 px-2.5 py-1 text-xs font-bold text-[#ffd35e]">
              👑 Создатель
            </span>
          )}
          {place.popularity_score >= 10 && (
            <span className="rounded-full bg-[#ff4b8a]/15 px-2.5 py-1 text-xs font-bold text-[#ff9bc5]">
              🔥 Популярная тусовка
            </span>
          )}
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-[#aaa4b7]">
            {place.popularity_score} активность
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <UsersRound className="size-5 text-[#9e88ff]" />
          <p className="text-sm font-bold">
            Сейчас здесь {online}{" "}
            {online === 1
              ? "человек"
              : online >= 2 && online <= 4
                ? "человека"
                : "человек"}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#aaa4b7]">
          <span>{memberCount ?? 0} участников</span>
          <span>{messageCount ?? 0} сообщений</span>
          {place.kind !== "fixed" && <span>{liveCount ?? 0} эфиров</span>}
          <span>
            Создано{" "}
            {new Intl.DateTimeFormat("ru-RU", {
              day: "numeric",
              month: "short",
            }).format(new Date(place.created_at))}
          </span>
        </div>
        {place.description && (
          <p className="mt-2 text-sm leading-6 text-[#b9b1c5]">{place.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {people.length === 0 ? (
            <p className="text-xs text-[#aaa4b7]">Пока пусто — будь первым здесь!</p>
          ) : (
            people.map((person) => (
              <span
                className="border-white/8 flex items-center gap-2 rounded-full border bg-white/5 py-1 pl-2.5 pr-1 text-xs"
                key={person.id}
              >
                <Link
                  className="flex items-center gap-1.5 transition hover:text-[#8df0b4]"
                  href={`/u/${person.username}` as Route}
                  title="Подойти и познакомиться"
                >
                  <span className="size-1.5 rounded-full bg-[#8df0b4]" />
                  {person.display_name}
                  {person.is_creator && " 👑"}
                </Link>
                {person.id !== user.id && giftCatalog && giftCatalog.length > 0 && (
                  <PlaceGiftButton
                    gifts={giftCatalog.map((gift) => ({
                      code: gift.code,
                      label: gift.label,
                      emoji: gift.emoji,
                      price_minor: gift.price_minor,
                    }))}
                    placeId={place.id}
                    recipientId={person.id}
                  />
                )}
                {person.id !== user.id && (myInvitePlaces ?? []).length > 0 && (
                  <PlaceInviteButton
                    places={(myInvitePlaces ?? []).map((p) => ({
                      id: p.id,
                      name: p.name,
                      emoji: p.emoji,
                    }))}
                    profileId={person.id}
                    returnTo={`/places/${place.id}`}
                  />
                )}
              </span>
            ))
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <form action={enterPlace}>
            <input name="place_id" type="hidden" value={place.id} />
            <button
              className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
              type="submit"
            >
              Я здесь
            </button>
          </form>
          <form action={leavePlace}>
            <input name="place_id" type="hidden" value={place.id} />
            <button
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
              type="submit"
            >
              Выйти
            </button>
          </form>
          {!isMember && place.kind !== "fixed" && (
            <form action={joinPlace}>
              <input name="place_id" type="hidden" value={place.id} />
              <button
                className="rounded-xl border border-[#b550ff]/40 bg-[#1b1528] px-4 py-2 text-sm font-semibold text-[#e7c9f5]"
                type="submit"
              >
                Вступить
              </button>
            </form>
          )}
        </div>
        {place.creator_id === user.id && place.kind !== "fixed" && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <form action={promotePlaceWithBonus}>
              <input name="place_id" type="hidden" value={place.id} />
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ffd35e]/40 bg-[#2a2215] py-2.5 text-sm font-bold text-[#ffd35e]"
                type="submit"
              >
                🚀 Поднять тусовку за 200 ⭐
              </button>
            </form>
            <p className="mt-2 text-xs text-[#a9a1b4]">
              Поднятое место 24 часа показывается первым в списке города.
            </p>
            <form action={pinPlaceWithBonus} className="mt-2">
              <input name="place_id" type="hidden" value={place.id} />
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ff4b8a]/40 bg-[#2a1222] py-2.5 text-sm font-bold text-[#ff9bc5]"
                type="submit"
              >
                📌 Закрепить на неделю за 500 ⭐
              </button>
            </form>
            <p className="mt-2 text-xs text-[#a9a1b4]">
              Закреплённое место всегда вверху списка города (7 дней).
            </p>
            {(themeCatalog?.length ?? 0) > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-[#e7c9f5]">Тема места</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(themeCatalog ?? []).map((theme) => (
                    <form action={buyPlaceTheme} key={theme.id}>
                      <input name="place_id" type="hidden" value={place.id} />
                      <input name="theme_id" type="hidden" value={theme.id} />
                      <button
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                          place.theme_id === theme.id
                            ? "border-[#8df0b4]/50 bg-[#15281d] text-[#8df0b4]"
                            : "border-white/15 bg-white/5"
                        }`}
                        type="submit"
                      >
                        {theme.name} · {theme.price_stars} ⭐
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            )}
            {(emblemCatalog?.length ?? 0) > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-[#e7c9f5]">Эмблема</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(emblemCatalog ?? []).map((emblem) => (
                    <form action={buyPlaceEmblem} key={emblem.id}>
                      <input name="place_id" type="hidden" value={place.id} />
                      <input name="emblem_id" type="hidden" value={emblem.id} />
                      <button
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                          place.emblem_id === emblem.id
                            ? "border-[#8df0b4]/50 bg-[#15281d] text-[#8df0b4]"
                            : "border-white/15 bg-white/5"
                        }`}
                        type="submit"
                      >
                        {emblem.emoji} {emblem.name} · {emblem.price_stars} ⭐
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            )}
            <form action={inviteToPlace} className="mt-3">
              <input name="place_id" type="hidden" value={place.id} />
              <p className="text-xs font-semibold text-[#e7c9f5]">Позвать в тусовку</p>
              <div className="mt-2 flex gap-2">
                <input
                  className="grow rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                  maxLength={30}
                  name="username"
                  placeholder="@username"
                  required
                />
                <button
                  className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold"
                  type="submit"
                >
                  Позвать
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {activeLive && (
        <section className="mt-5 rounded-2xl border border-[#ff2d55]/50 bg-gradient-to-r from-[#2a1222] to-[#1b1528] p-4">
          <p className="text-xs font-bold text-[#ff7fb5]">🔴 В ЭФИРЕ ВНУТРИ МЕСТА</p>
          <p className="mt-1 font-bold">{activeLive.title}</p>
          <Link
            className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#ff2d55] px-4 text-sm font-bold"
            href={`/live/${activeLive.slug}` as Route}
          >
            Смотреть эфир ›
          </Link>
        </section>
      )}

      {(placeEvents ?? []).length > 0 && (
        <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-[#7fd8ff]" />
            <h2 className="font-bold">События места</h2>
          </div>
          <div className="mt-3 space-y-2">
            {(placeEvents ?? []).map((event) => (
              <Link
                className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm"
                href={`/events/${event.id}` as Route}
                key={event.id}
              >
                <span className="truncate font-semibold">{event.title}</span>
                <span className="ml-2 shrink-0 text-xs text-[#aaa4b7]">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(event.starts_at))}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-[#d68cff]" />
          <h2 className="font-bold">Общий разговор</h2>
        </div>
        <LivePlaceChat
          currentUserId={user.id}
          initialAuthorRoles={Object.fromEntries(authorRoles)}
          initialMessages={(messages ?? []).map((message) => ({
            id: message.id,
            author_id: message.author_id,
            body: message.body,
            created_at: message.created_at,
            author_name: names.get(message.author_id) ?? "Зритель",
          }))}
          placeId={place.id}
        />
      </section>
    </main>
  );
}
