/* eslint-disable @next/next/no-img-element -- avatars use short-lived signed Storage URLs */
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CalendarX2,
  CheckCheck,
  Gift,
  Gem,
  Heart,
  MapPin,
  MessageCircle,
  Radio,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { markAllNotificationsRead } from "@/app/social/actions";
import { CityPulse, type CityPulseItem } from "@/components/city-pulse";
import { CityPulseRefresh } from "@/components/city-pulse-refresh";
import { LiveNotificationRefresh } from "@/components/live-notification-refresh";
import { PushNotificationButton } from "@/components/push-notification-button";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Активность",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Notification = {
  id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

type Actor = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

function notificationCopy(notification: Notification, actor: Actor | undefined) {
  const actorName = actor?.display_name ?? "Пользователь";
  if (notification.type === "user_followed")
    return {
      icon: UserPlus,
      title: `${actorName} подписался(-ась) на вас`,
      href: actor ? (`/u/${actor.username}` as Route) : ("/notifications" as Route),
    };
  if (notification.type === "private_fundraiser_invite") {
    const title =
      typeof notification.payload.fundraiser_title === "string"
        ? notification.payload.fundraiser_title
        : "приватный сбор";
    return {
      icon: Gift,
      title: `${actorName} пригласил(-а) вас в «${title}»`,
      href: "/invitations" as Route,
    };
  }
  if (notification.type === "fundraiser_support_succeeded") {
    const amount = Number(notification.payload.amount_minor ?? 0);
    return {
      icon: Heart,
      title: `${actorName} поддержал(-а) ваш сбор на ${formatRubles(amount)}`,
      href: "/notifications" as Route,
    };
  }
  if (notification.type === "fundraiser_gift") {
    const slug =
      typeof notification.payload.slug === "string" ? notification.payload.slug : null;
    return {
      icon: Gift,
      title: `${actorName} отправил(а) подарок в ваш сбор`,
      href: slug ? (`/fundraisers/${slug}` as Route) : ("/notifications" as Route),
    };
  }
  if (notification.type === "fundraiser_follow") {
    const slug =
      typeof notification.payload.slug === "string" ? notification.payload.slug : null;
    return {
      icon: Bell,
      title: `${actorName} теперь следит за вашим сбором`,
      href: slug ? (`/fundraisers/${slug}` as Route) : ("/notifications" as Route),
    };
  }
  if (notification.type === "wish_also_want") {
    const wishTitle =
      typeof notification.payload.wish_title === "string"
        ? notification.payload.wish_title
        : "ваше желание";
    return {
      icon: Sparkles,
      title: `${actorName} тоже хочет «${wishTitle}»`,
      href: notification.entity_id
        ? (`/wishes/${notification.entity_id}` as Route)
        : ("/notifications" as Route),
    };
  }
  if (
    notification.type === "creator_offer_request" ||
    notification.type === "paid_message_request"
  )
    return {
      icon: MessageCircle,
      title: `${actorName} отправил(-а) запрос на действие`,
      href:
        notification.type === "creator_offer_request"
          ? ("/creator/offer-requests" as Route)
          : ("/creator/requests" as Route),
    };
  if (notification.type === "creator_artifact_request") {
    const seriesTitle =
      typeof notification.payload.series_title === "string"
        ? notification.payload.series_title
        : "артефакт";
    return {
      icon: Gem,
      title: `${actorName} хочет поддержать вас артефактом «${seriesTitle}»`,
      href: "/creator/artifact-requests" as Route,
    };
  }
  if (notification.type === "live_cohost_invite") {
    const slug =
      typeof notification.payload.slug === "string" ? notification.payload.slug : null;
    return {
      icon: MessageCircle,
      title: `${actorName} пригласил(-а) вас в совместный эфир`,
      href: slug ? (`/live/${slug}` as Route) : ("/notifications" as Route),
    };
  }
  if (notification.type === "live_started") {
    const slug =
      typeof notification.payload.slug === "string" ? notification.payload.slug : null;
    const roomTitle =
      typeof notification.payload.title === "string"
        ? notification.payload.title
        : "эфир";
    return {
      icon: Radio,
      title: `${actorName} начал(а) эфир «${roomTitle}»`,
      href: slug ? (`/live/${slug}` as Route) : ("/feed" as Route),
    };
  }
  if (notification.type === "event_created") {
    const eventTitle =
      typeof notification.payload.event_title === "string"
        ? notification.payload.event_title
        : "событие";
    const isOpen = notification.payload.scope === "open";
    return {
      icon: CalendarDays,
      title: isOpen
        ? `${actorName} создал(а) открытое событие «${eventTitle}»`
        : `В вашем городе: «${eventTitle}»`,
      href: notification.entity_id
        ? (`/events/${notification.entity_id}` as Route)
        : ("/events" as Route),
    };
  }
  if (notification.type === "event_cancelled") {
    const eventTitle =
      typeof notification.payload.event_title === "string"
        ? notification.payload.event_title
        : "событие";
    return {
      icon: CalendarX2,
      title: `Событие «${eventTitle}» отменено`,
      href: notification.entity_id
        ? (`/events/${notification.entity_id}` as Route)
        : ("/events" as Route),
    };
  }
  if (notification.type === "collectible_artifact_received") {
    const artifactTitle =
      typeof notification.payload.artifact_title === "string"
        ? notification.payload.artifact_title
        : "артефакт";
    const serial = Number(notification.payload.serial_number);
    return {
      icon: Gem,
      title: Number.isFinite(serial)
        ? `Тебе подарили «${artifactTitle}» · #${serial}`
        : `Тебе подарили «${artifactTitle}»`,
      href: notification.entity_id
        ? (`/collection/unbox/${notification.entity_id}` as Route)
        : ("/collection" as Route),
    };
  }
  if (notification.type === "place_invite") {
    const placeName =
      typeof notification.payload.place_name === "string"
        ? notification.payload.place_name
        : "тусовку";
    return {
      icon: MapPin,
      title: `${actorName} позвал(а) вас в ${placeName}`,
      href: notification.entity_id
        ? (`/places/${notification.entity_id}` as Route)
        : ("/places" as Route),
    };
  }
  if (notification.type === "place_message") {
    const placeName =
      typeof notification.payload.place_name === "string"
        ? notification.payload.place_name
        : "место";
    return {
      icon: MessageCircle,
      title: `${actorName} написал(а) в чат места «${placeName}»`,
      href: notification.entity_id
        ? (`/places/${notification.entity_id}` as Route)
        : ("/places" as Route),
    };
  }
  if (notification.type === "place_gift") {
    const giftLabel =
      typeof notification.payload.gift_label === "string"
        ? notification.payload.gift_label
        : "подарок";
    return {
      icon: Gift,
      title: `${actorName} отправил(а) вам подарок (${giftLabel})`,
      href: notification.entity_id
        ? (`/places/${notification.entity_id}` as Route)
        : ("/places" as Route),
    };
  }
  if (notification.type === "direct_message")
    return {
      icon: MessageCircle,
      title: `${actorName} отправил(-а) вам сообщение`,
      href: notification.entity_id
        ? (`/messages/${notification.entity_id}` as Route)
        : ("/messages" as Route),
    };
  if (
    notification.type === "creator_offer_request_accepted" ||
    notification.type === "paid_message_request_accepted"
  )
    return {
      icon: Heart,
      title: `${actorName} принял(-а) ваш запрос`,
      href: "/notifications" as Route,
    };
  if (
    notification.type === "creator_offer_request_rejected" ||
    notification.type === "paid_message_request_rejected"
  )
    return {
      icon: Bell,
      title: `${actorName} отклонил(-а) ваш запрос`,
      href: "/notifications" as Route,
    };
  return {
    icon: Bell,
    title: "Новое событие в «Хочу также»",
    href: "/notifications" as Route,
  };
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab = "" } = await searchParams;
  const tab = rawTab === "city" ? "city" : "personal";
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: rawNotifications }] = await Promise.all([
    supabase.from("profiles").select("city_id, city").eq("id", user.id).maybeSingle(),
    supabase
      .from("notifications")
      .select(
        "id, actor_id, type, entity_type, entity_id, payload, read_at, created_at",
      )
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const notifications = (rawNotifications ?? []) as Notification[];
  const actorIds = [
    ...new Set(notifications.map((item) => item.actor_id).filter(Boolean)),
  ] as string[];
  const { data: rawActors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_path")
        .in("id", actorIds)
    : { data: [] };
  const actors = new Map<string, Actor>();
  for (const actor of rawActors ?? []) {
    actors.set(actor.id, {
      id: actor.id,
      username: actor.username,
      display_name: actor.display_name,
      avatar_url: await getSignedImageUrl({
        bucket: "avatars",
        path: actor.avatar_path,
      }),
    });
  }
  const hasUnread = notifications.some((item) => !item.read_at);

  let cityName: string | null = null;
  let cityPulse: CityPulseItem[] = [];
  if (profile?.city_id) {
    const { data: cityRow } = await supabase
      .from("cities")
      .select("name")
      .eq("id", profile.city_id)
      .maybeSingle();
    cityName = cityRow?.name ?? profile.city ?? null;
    const [{ data: rawPulse }, { data: rawMoments }] = await Promise.all([
      supabase
        .from("public_city_pulse")
        .select(
          "city_id, kind, actor_id, actor_name, actor_username, actor_avatar_path, target_id, target_name, target_emoji, target_slug, created_at",
        )
        .eq("city_id", profile.city_id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("public_city_social_moments")
        .select(
          "city_id, kind, actor_id, actor_name, actor_username, actor_avatar_path, target_id, target_name, target_slug, created_at",
        )
        .eq("city_id", profile.city_id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    const rows = [
      ...((rawPulse ?? []) as Array<{
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
      }>),
      ...(
        (rawMoments ?? []) as Array<{
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
        }>
      ).map((item) => ({
        ...item,
        target_id: item.target_id ?? item.actor_id,
        target_emoji: "",
      })),
    ].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    cityPulse = await Promise.all(
      rows.slice(0, 8).map(async (item) => ({
        ...item,
        actor_avatar_url: await getSignedImageUrl({
          bucket: "avatars",
          path: item.actor_avatar_path,
        }),
      })),
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <LiveNotificationRefresh recipientId={user.id} />
      <CityPulseRefresh cityId={profile?.city_id} />
      <header className="flex items-center justify-between">
        <Link
          className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white shadow-[0_6px_18px_rgba(64,38,88,.08)]"
          href="/feed"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8753e6]">
            Активность
          </p>
          <h1 className="text-lg font-black tracking-[-0.03em]">Что нового</h1>
        </span>
        {hasUnread && tab === "personal" ? (
          <form action={markAllNotificationsRead}>
            <button
              className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#8753e6]"
              title="Прочитать всё"
              type="submit"
            >
              <CheckCheck className="size-4" />
            </button>
          </form>
        ) : (
          <span className="w-10" />
        )}
      </header>

      <nav className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-[#2c2036]/10 bg-white p-1 text-center text-xs font-black">
        <Link
          className={`rounded-xl py-2.5 ${tab === "personal" ? "bg-[#f1e8ff] text-[#7549d0]" : "text-[#82758a]"}`}
          href="/notifications"
        >
          У тебя
          {hasUnread
            ? ` · ${notifications.filter((item) => !item.read_at).length}`
            : ""}
        </Link>
        <Link
          className={`rounded-xl py-2.5 ${tab === "city" ? "bg-[#f1e8ff] text-[#7549d0]" : "text-[#82758a]"}`}
          href="/notifications?tab=city"
        >
          В городе
        </Link>
      </nav>

      {tab === "personal" ? (
        <>
          <section className="mt-5 rounded-2xl border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-4">
            <p className="text-sm font-black">Не пропускай своих</p>
            <p className="mt-1 text-[11px] leading-5 text-[#756a7d]">
              Push напомнит, когда автор выходит в эфир или в твоих местах начинается
              движение.
            </p>
            <div className="mt-3">
              <PushNotificationButton />
            </div>
          </section>
          <section className="mt-6">
            {notifications.length === 0 ? (
              <div className="rounded-[1.8rem] border border-dashed border-[#2c2036]/20 bg-white/70 p-6 text-center">
                <Bell className="mx-auto size-7 text-[#8753e6]" />
                <h2 className="mt-4 text-lg font-black">Пока тихо</h2>
                <p className="mt-2 text-[11px] leading-5 text-[#7b7083]">
                  Когда у тебя или у твоих людей произойдёт что-то важное, это появится
                  здесь.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((notification) => {
                  const actor = notification.actor_id
                    ? actors.get(notification.actor_id)
                    : undefined;
                  const copy = notificationCopy(notification, actor);
                  const Icon = copy.icon;
                  const date = new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(notification.created_at));
                  return (
                    <Link
                      className={`flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-[0_6px_18px_rgba(69,43,94,.05)] ${notification.read_at ? "border-[#2c2036]/10" : "border-[#e9b2d0]"}`}
                      href={copy.href}
                      key={notification.id}
                    >
                      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff78ad] to-[#8753ed] p-0.5">
                        <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f7f1fa] text-[#8753e6]">
                          {actor?.avatar_url ? (
                            <img
                              loading="lazy"
                              decoding="async"
                              alt=""
                              className="size-full object-cover"
                              src={actor.avatar_url}
                            />
                          ) : (
                            <Icon className="size-4" />
                          )}
                        </span>
                      </span>
                      <span className="min-w-0 grow">
                        <span className="block text-[11px] font-semibold leading-5">
                          {copy.title}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-[#81748a]">
                          {date}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : profile?.city_id && cityName ? (
        <>
          <section className="mt-5 rounded-2xl bg-gradient-to-br from-[#2e2250] via-[#4d3572] to-[#7559d5] p-4 text-white shadow-[0_12px_28px_rgba(63,37,98,.2)]">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#ffc3da]">
              {cityName} сейчас
            </p>
            <h2 className="mt-1 text-xl font-black">Что продолжилось без тебя</h2>
            <p className="text-white/72 mt-2 text-[11px] leading-5">
              Только публичные события и opt-in моменты городской сцены.
            </p>
          </section>
          <CityPulse cityName={cityName} items={cityPulse} />
          <Link
            className="mt-5 flex items-center justify-center gap-1 text-xs font-black text-[#8753e6]"
            href="/places"
          >
            Открыть {cityName} сейчас <MapPin className="size-3.5" />
          </Link>
        </>
      ) : (
        <section className="mt-12 rounded-[1.8rem] border border-dashed border-[#2c2036]/20 bg-white/70 p-6 text-center">
          <MapPin className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-4 text-lg font-black">Выбери город</h2>
          <p className="mt-2 text-[11px] leading-5 text-[#7b7083]">
            Тогда здесь появится безопасная сводка того, что происходит у ваших.
          </p>
          <Link
            className="mt-4 inline-flex text-xs font-black text-[#8753e6]"
            href="/settings"
          >
            Открыть настройки
          </Link>
        </section>
      )}
    </main>
  );
}
