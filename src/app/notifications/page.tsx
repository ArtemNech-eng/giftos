import Link from "next/link";
import type { Route } from "next";
import {
  Bell,
  CalendarDays,
  CalendarX2,
  CheckCheck,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Radio,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { markAllNotificationsRead } from "@/app/social/actions";
import { EmptyState } from "@/components/empty-state";
import { PushNotificationButton } from "@/components/push-notification-button";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Уведомления",
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

type Actor = { id: string; username: string; display_name: string };

function notificationCopy(notification: Notification, actor: Actor | undefined) {
  const actorName = actor?.display_name ?? "Пользователь";

  if (notification.type === "user_followed") {
    return {
      icon: UserPlus,
      title: `${actorName} подписался(-ась) на вас`,
      href: actor ? (`/u/${actor.username}` as Route) : "/notifications",
    };
  }

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
      href: slug ? (`/fundraisers/${slug}` as Route) : "/notifications",
    };
  }

  if (notification.type === "fundraiser_follow") {
    const slug =
      typeof notification.payload.slug === "string" ? notification.payload.slug : null;
    return {
      icon: Bell,
      title: `${actorName} теперь следит за вашим сбором`,
      href: slug ? (`/fundraisers/${slug}` as Route) : "/notifications",
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
        : "/notifications",
    };
  }

  if (
    notification.type === "creator_offer_request" ||
    notification.type === "paid_message_request"
  ) {
    return {
      icon: MessageCircle,
      title: `${actorName} отправил(-а) запрос на платное действие`,
      href:
        notification.type === "creator_offer_request"
          ? ("/creator/offer-requests" as Route)
          : ("/creator/requests" as Route),
    };
  }

  if (notification.type === "live_cohost_invite") {
    const slug =
      typeof notification.payload.slug === "string" ? notification.payload.slug : null;
    return {
      icon: MessageCircle,
      title: `${actorName} пригласил(-а) вас в совместный эфир`,
      href: slug ? (`/live/${slug}` as Route) : "/notifications",
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
      href: slug ? (`/live/${slug}` as Route) : "/feed",
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
        : "/events",
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
        : "/events",
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
        : "/places",
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
        : "/places",
    };
  }

  if (notification.type === "direct_message") {
    return {
      icon: MessageCircle,
      title: `${actorName} отправил(-а) вам сообщение`,
      href: notification.entity_id
        ? (`/messages/${notification.entity_id}` as Route)
        : "/messages",
    };
  }

  if (
    notification.type === "creator_offer_request_accepted" ||
    notification.type === "paid_message_request_accepted"
  ) {
    return {
      icon: Heart,
      title: `${actorName} принял(-а) ваш запрос`,
      href: "/notifications" as Route,
    };
  }

  if (
    notification.type === "creator_offer_request_rejected" ||
    notification.type === "paid_message_request_rejected"
  ) {
    return {
      icon: Bell,
      title: `${actorName} отклонил(-а) ваш запрос`,
      href: "/notifications" as Route,
    };
  }

  return {
    icon: Bell,
    title: "Новое событие в «Хочу также»",
    href: "/notifications" as Route,
  };
}

export default async function NotificationsPage() {
  const { supabase, user } = await requireUser();
  const { data: rawNotifications } = await supabase
    .from("notifications")
    .select("id, actor_id, type, entity_type, entity_id, payload, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const notifications = (rawNotifications ?? []) as Notification[];
  const actorIds = [
    ...new Set(notifications.map((item) => item.actor_id).filter(Boolean)),
  ] as string[];
  const { data: rawActors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", actorIds)
    : { data: [] };
  const actors = new Map((rawActors ?? []).map((actor) => [actor.id, actor as Actor]));
  const hasUnread = notifications.some((item) => !item.read_at);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#bd3e66]">Ваши события</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Уведомления</h1>
          </div>
          {hasUnread && (
            <form action={markAllNotificationsRead}>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ead9df] bg-white px-3.5 text-sm font-semibold text-[#765f66] transition hover:border-[#df4f7d]"
                type="submit"
              >
                <CheckCheck className="size-4" /> Прочитать всё
              </button>
            </form>
          )}
        </div>

        <section className="mt-6 rounded-2xl bg-[#fff8f9] p-4">
          <p className="font-semibold">Браузерные уведомления</p>
          <p className="mt-1 text-sm leading-5 text-[#826c73]">
            Получайте push, когда любимый автор выходит в эфир.
          </p>
          <div className="mt-3">
            <PushNotificationButton />
          </div>
        </section>

        <section className="mt-7">
          {notifications.length === 0 ? (
            <EmptyState
              actionHref="/"
              actionLabel="К ленте"
              description="Когда кто-то поддержит ваш сбор, подпишется на вас или пригласит в приватный сбор, событие появится здесь."
              title="Пока нет уведомлений"
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const copy = notificationCopy(
                  notification,
                  notification.actor_id ? actors.get(notification.actor_id) : undefined,
                );
                const Icon = copy.icon;
                const date = new Intl.DateTimeFormat("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(notification.created_at));
                return (
                  <Link
                    className={`surface flex items-start gap-3 rounded-2xl p-4 transition hover:shadow-glow ${notification.read_at ? "opacity-70" : "border-[#efadc1]"}`}
                    href={copy.href}
                    key={notification.id}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fce5ec] text-[#d34872]">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-6">
                        {copy.title}
                      </span>
                      <span className="mt-1 block text-xs text-[#9b858c]">{date}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
