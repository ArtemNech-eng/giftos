/* eslint-disable @next/next/no-img-element -- avatars use short-lived signed Storage URLs */
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleDot,
  Radio,
  Sparkles,
  TrendingUp,
  Pin,
  UsersRound,
} from "lucide-react";
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
  useCityAmbassadorPromotion,
} from "@/app/places/actions";
import { BrandGiftIcon } from "@/components/brand-gift-icon";
import { LivePlaceChat } from "@/components/live-place-chat";
import { PlaceGiftButton } from "@/components/place-gift-button";
import { PlaceRoomRefresh } from "@/components/place-room-refresh";
import { PlaceEmblemIcon } from "@/components/place-emblem-icon";
import { PlaceIcon } from "@/components/place-icon";
import { PlaceInviteButton } from "@/components/place-invite-button";
import { ReportForm } from "@/components/report-form";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";

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
      "id, city_id, creator_id, name, description, icon_code, kind, created_at, popularity_score, theme_id, emblem_id, place_themes!left(gradient), place_emblems!left(icon_code)",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (!place) notFound();
  const placeThemeGradient = Array.isArray(place.place_themes)
    ? (place.place_themes[0]?.gradient ?? null)
    : null;
  const placeEmblem = Array.isArray(place.place_emblems)
    ? (place.place_emblems[0]?.icon_code ?? null)
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
      .select("id, name, icon_code, price_stars")
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
    .select("id, name, icon_code")
    .eq("creator_id", user.id)
    .eq("is_active", true)
    .neq("kind", "fixed")
    .limit(20);
  const onlineIds = (presence ?? []).map((row) => row.profile_id);
  const { data: onlineProfiles } = onlineIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_path, is_creator")
        .in("id", onlineIds)
    : { data: [] };
  const profileById = new Map(
    (onlineProfiles ?? []).map((profile) => [profile.id, profile]),
  );
  const people = (presence ?? [])
    .map((row) => profileById.get(row.profile_id))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
  const { data: myFollows } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);
  const followingSet = new Set((myFollows ?? []).map((row) => row.following_id));
  const peopleWithAvatars = await Promise.all(
    [...people]
      .sort((a, b) => Number(followingSet.has(b.id)) - Number(followingSet.has(a.id)))
      .map(async (person) => ({
        ...person,
        avatarUrl: await getSignedImageUrl({
          bucket: "avatars",
          path: person.avatar_path,
        }),
      })),
  );

  const { data: rawMoments } = await supabase
    .from("public_city_social_moments")
    .select(
      "kind, actor_id, actor_name, actor_username, actor_avatar_path, target_id, target_name, target_slug, created_at",
    )
    .eq("city_id", place.city_id)
    .eq("target_id", place.id)
    .order("created_at", { ascending: false })
    .limit(4);
  const placeMoments = await Promise.all(
    (
      (rawMoments ?? []) as Array<{
        kind:
          "place_join" | "place_gift" | "profile_gift" | "live_gift" | "live_donation";
        actor_id: string;
        actor_name: string;
        actor_username: string;
        actor_avatar_path: string | null;
        target_id: string | null;
        target_name: string;
        target_slug: string | null;
        created_at: string;
      }>
    ).map(async (moment) => ({
      ...moment,
      avatarUrl: await getSignedImageUrl({
        bucket: "avatars",
        path: moment.actor_avatar_path,
      }),
    })),
  );

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
  const { data: rawAmbassadorProgress } = await supabase.rpc(
    "city_ambassador_progress",
  );
  const ambassadorProgress = (
    (rawAmbassadorProgress ?? []) as Array<{
      city_id: string | null;
      is_ambassador: boolean;
      promotion_credits: number;
    }>
  )[0];
  const canUseAmbassadorPromotion = Boolean(
    place.creator_id === user.id &&
    place.kind !== "fixed" &&
    ambassadorProgress?.is_ambassador &&
    ambassadorProgress.city_id === place.city_id &&
    ambassadorProgress.promotion_credits > 0,
  );

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <PlaceRoomRefresh placeId={place.id} />
      <header className="flex items-center justify-between">
        <Link
          className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white shadow-[0_6px_18px_rgba(64,38,88,.08)]"
          href="/places"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex items-center gap-2 text-lg font-black tracking-[-0.03em]">
          <PlaceIcon className="size-5 text-[#8753e6]" code={place.icon_code} />
          {place.name}
          {placeEmblem && (
            <PlaceEmblemIcon className="size-5 text-[#b8860b]" code={placeEmblem} />
          )}
        </h1>
        <ReportForm
          returnTo={`/places/${place.id}`}
          targetId={place.id}
          targetType="place"
        />
      </header>

      <section
        className={`mt-5 rounded-[1.8rem] border border-[#2c2036]/10 p-5 shadow-[0_12px_30px_rgba(69,43,94,.07)] ${
          placeThemeGradient ? `bg-gradient-to-br ${placeThemeGradient}` : "bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {place.kind !== "fixed" && place.creator_id && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d8] px-2.5 py-1 text-xs font-bold text-[#a87511]">
              <Sparkles className="size-3" /> Создатель
            </span>
          )}
          {place.popularity_score >= 10 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0f6] px-2.5 py-1 text-xs font-bold text-[#d84b81]">
              <CircleDot className="size-3" /> Популярная тусовка
            </span>
          )}
          <span className="rounded-full bg-[#f5eff8] px-2.5 py-1 text-xs text-[#756a7d]">
            {place.popularity_score} активности
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <UsersRound className="size-5 text-[#8753e6]" />
          <p className="text-sm font-black">
            Сейчас здесь {online}{" "}
            {online === 1
              ? "человек"
              : online >= 2 && online <= 4
                ? "человека"
                : "человек"}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#756a7d]">
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
          <p className="mt-3 text-sm leading-6 text-[#62566c]">{place.description}</p>
        )}
        <div className="mt-4">
          {peopleWithAvatars.length === 0 ? (
            <p className="rounded-xl bg-[#f7f2fa] p-3 text-xs text-[#7b7083]">
              Пока никого нет — отметься «Я здесь», чтобы место стало живым для
              следующих людей.
            </p>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {peopleWithAvatars.map((person) => (
                <div
                  className="w-28 shrink-0 rounded-2xl border border-[#2c2036]/10 bg-white p-2.5 text-center"
                  key={person.id}
                >
                  <Link href={`/u/${person.username}` as Route} title="Открыть профиль">
                    <span className="relative mx-auto grid size-11 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff78ad] to-[#8753ed] p-0.5">
                      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f7f1fa] text-xs font-black text-[#33263d]">
                        {person.avatarUrl ? (
                          <img
                            alt=""
                            className="size-full object-cover"
                            src={person.avatarUrl}
                          />
                        ) : (
                          person.display_name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-[#47bf8e]" />
                    </span>
                    <b className="mt-1.5 block truncate text-[10px]">
                      {person.display_name}
                    </b>
                  </Link>
                  {person.id !== user.id && (
                    <div className="mt-2 flex justify-center gap-1">
                      {giftCatalog && giftCatalog.length > 0 && (
                        <PlaceGiftButton
                          gifts={giftCatalog.map((gift) => ({
                            code: gift.code,
                            label: gift.label,
                            price_minor: gift.price_minor,
                          }))}
                          placeId={place.id}
                          recipientId={person.id}
                        />
                      )}
                      {(myInvitePlaces ?? []).length > 0 && (
                        <PlaceInviteButton
                          places={(myInvitePlaces ?? []).map((p) => ({
                            id: p.id,
                            name: p.name,
                            icon_code: p.icon_code,
                          }))}
                          profileId={person.id}
                          returnTo={`/places/${place.id}`}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <form className="grow" action={enterPlace}>
            <input name="place_id" type="hidden" value={place.id} />
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2.5 text-sm font-black text-white shadow-[0_7px_16px_rgba(160,75,213,.2)]"
              type="submit"
            >
              <CircleDot className="size-4" /> Я здесь
            </button>
          </form>
          {isMember ? (
            <form action={leavePlace}>
              <input name="place_id" type="hidden" value={place.id} />
              <button
                className="rounded-xl border border-[#2c2036]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#665a72]"
                type="submit"
              >
                Выйти
              </button>
            </form>
          ) : place.kind !== "fixed" ? (
            <form action={joinPlace}>
              <input name="place_id" type="hidden" value={place.id} />
              <button
                className="rounded-xl border border-[#ad7bf4]/35 bg-[#f2eaff] px-4 py-2.5 text-sm font-semibold text-[#7549d0]"
                type="submit"
              >
                Вступить
              </button>
            </form>
          ) : null}
        </div>
        {place.creator_id === user.id && place.kind !== "fixed" && (
          <div className="mt-4 border-t border-white/10 pt-3">
            {canUseAmbassadorPromotion && (
              <form action={useCityAmbassadorPromotion}>
                <input name="place_id" type="hidden" value={place.id} />
                <button
                  className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#ffbd5e]/50 bg-gradient-to-r from-[#3b2a16] to-[#2a1d2a] py-2.5 text-sm font-bold text-[#ffdc8a]"
                  type="submit"
                >
                  <Building2 className="size-4" /> Продвинуть как амбассадор — бесплатно
                </button>
              </form>
            )}
            <form action={promotePlaceWithBonus}>
              <input name="place_id" type="hidden" value={place.id} />
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ffd35e]/40 bg-[#2a2215] py-2.5 text-sm font-bold text-[#ffd35e]"
                type="submit"
              >
                <TrendingUp className="size-4" /> Поднять тусовку за 200 ⭐
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
                <Pin className="size-4" /> Закрепить на неделю за 500 ⭐
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
                        <PlaceEmblemIcon
                          className="mr-1 inline size-3.5"
                          code={emblem.icon_code}
                        />
                        {emblem.name} · {emblem.price_stars} ⭐
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

      {placeMoments.length > 0 && (
        <section className="mt-5 overflow-hidden rounded-[1.6rem] border border-[#2c2036]/10 bg-white shadow-[0_10px_25px_rgba(69,43,94,.06)]">
          <div className="border-[#2c2036]/8 flex items-center justify-between border-b px-4 py-3">
            <span>
              <h2 className="text-sm font-black">Последнее в месте</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Только публичные моменты участников
              </p>
            </span>
            <Sparkles className="size-4 text-[#8753e6]" />
          </div>
          <div className="divide-[#2c2036]/8 divide-y">
            {placeMoments.map((moment) => {
              const isGift = moment.kind === "place_gift";
              return (
                <Link
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#faf6fd]"
                  href={`/u/${moment.actor_username}` as Route}
                  key={`${moment.kind}-${moment.actor_id}-${moment.created_at}`}
                >
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff78ad] to-[#8753ed] p-0.5">
                    <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f7f1fa] text-xs font-black text-[#33263d]">
                      {moment.avatarUrl ? (
                        <img
                          alt=""
                          className="size-full object-cover"
                          src={moment.avatarUrl}
                        />
                      ) : (
                        moment.actor_name.slice(0, 1).toUpperCase()
                      )}
                    </span>
                  </span>
                  <span className="min-w-0 grow text-[11px]">
                    <b>{moment.actor_name}</b>{" "}
                    <span className="text-[#6e6178]">
                      {isGift
                        ? `отправил(а) подарок ${moment.target_name}`
                        : `присоединился(-ась) к «${place.name}»`}
                    </span>
                  </span>
                  {isGift ? (
                    <BrandGiftIcon className="size-5 text-[#d84b81]" code="heart" />
                  ) : (
                    <UsersRound className="size-4 text-[#8753e6]" />
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {activeLive && (
        <section className="mt-5 rounded-2xl border border-[#ffc5da] bg-gradient-to-r from-[#fff0f6] to-[#f4edff] p-4">
          <p className="flex items-center gap-1.5 text-xs font-black text-[#d84b81]">
            <Radio className="size-3.5" /> В эфире внутри места
          </p>
          <p className="mt-1 text-sm font-black">{activeLive.title}</p>
          <Link
            className="mt-3 inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 text-sm font-bold text-white"
            href={`/live/${activeLive.slug}` as Route}
          >
            Смотреть эфир
          </Link>
        </section>
      )}

      {(placeEvents ?? []).length > 0 && (
        <section className="mt-5 rounded-2xl border border-[#c8e5e1] bg-[#f1faf8] p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-[#258b82]" />
            <h2 className="text-sm font-black">События места</h2>
          </div>
          <div className="mt-3 space-y-2">
            {(placeEvents ?? []).map((event) => (
              <Link
                className="border-[#2c2036]/8 flex items-center justify-between rounded-xl border bg-white p-3 text-sm"
                href={`/events/${event.id}` as Route}
                key={event.id}
              >
                <span className="truncate font-semibold">{event.title}</span>
                <span className="ml-2 shrink-0 text-xs text-[#756a7d]">
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

      <section className="mt-5 rounded-[1.6rem] border border-[#2c2036]/10 bg-white p-4 shadow-[0_10px_25px_rgba(69,43,94,.06)]">
        <div className="flex items-center gap-2">
          <CircleDot className="size-5 text-[#8753e6]" />
          <span>
            <h2 className="text-sm font-black">Общий разговор</h2>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              Говорят те, кто сейчас в этой тусовке
            </p>
          </span>
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
