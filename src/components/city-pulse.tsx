import Link from "next/link";
import type { Route } from "next";
import {
  CalendarDays,
  Gift,
  MapPin,
  MessageCircle,
  Radio,
  Sparkles,
  UsersRound,
} from "lucide-react";

export type CityPulseItem = {
  city_id: string;
  kind:
    | "presence"
    | "place_message"
    | "live"
    | "event"
    | "ambassador"
    | "place_join"
    | "place_gift"
    | "profile_gift"
    | "live_gift"
    | "live_donation"
    | "story_gift";
  actor_id: string;
  actor_name: string;
  actor_username: string;
  actor_avatar_url: string | null;
  target_id: string;
  target_name: string;
  target_emoji: string;
  target_slug: string | null;
  created_at: string;
};

function copyForPulse(item: CityPulseItem) {
  switch (item.kind) {
    case "presence":
      return {
        action: `сейчас в «${item.target_name}»`,
        href: `/places/${item.target_id}` as Route,
        label: "сейчас здесь",
      };
    case "place_message":
      return {
        action: `общается в «${item.target_name}»`,
        href: `/places/${item.target_id}` as Route,
        label: "идёт разговор",
      };
    case "live":
      return {
        action: `в эфире: «${item.target_name}»`,
        href: item.target_slug
          ? (`/live/${item.target_slug}` as Route)
          : ("/feed" as Route),
        label: "в эфире",
      };
    case "event":
      return {
        action: `собирает «${item.target_name}»`,
        href: `/events/${item.target_id}` as Route,
        label: "новое событие",
      };
    case "ambassador":
      return {
        action: "стал(а) «Первой волной» города",
        href: `/u/${item.actor_username}` as Route,
        label: "новый амбассадор",
      };
    case "place_join":
      return {
        action: `присоединился(-ась) к «${item.target_name}»`,
        href: `/places/${item.target_id}` as Route,
        label: "новый участник тусовки",
      };
    case "place_gift":
      return {
        action: `отправил(а) подарок ${item.target_name}`,
        href: `/places/${item.target_id}` as Route,
        label: "публичный подарок",
      };
    case "profile_gift":
      return {
        action: `отправил(а) подарок ${item.target_name}`,
        href: `/u/${item.actor_username}` as Route,
        label: "публичный подарок",
      };
    case "story_gift":
      return {
        action: `поддержал(а) story «${item.target_name}»`,
        href: `/stories/${item.target_id}` as Route,
        label: "поддержка story",
      };
    case "live_gift":
    case "live_donation":
      return {
        action: `поддержал(а) эфир «${item.target_name}»`,
        href: item.target_slug
          ? (`/live/${item.target_slug}` as Route)
          : ("/feed" as Route),
        label: "поддержка эфира",
      };
  }
}

function pulseIcon(kind: CityPulseItem["kind"]) {
  if (kind === "presence") return MapPin;
  if (kind === "place_message") return MessageCircle;
  if (kind === "event") return CalendarDays;
  if (kind === "live" || kind === "live_gift" || kind === "live_donation") return Radio;
  if (kind === "place_gift" || kind === "profile_gift" || kind === "story_gift")
    return Gift;
  return Sparkles;
}

function relativeTime(value: string) {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (minutes < 1) return "сейчас";
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.round(minutes / 60);
  return `${hours} ч`;
}

export function CityPulse({
  cityName,
  items,
}: {
  cityName: string;
  items: CityPulseItem[];
}) {
  if (items.length === 0) {
    return (
      <section className="mt-5 rounded-[1.5rem] border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-4 text-[#251d31] shadow-[0_10px_25px_rgba(85,51,115,.07)]">
        <div className="flex items-center gap-2">
          <UsersRound className="size-5 text-[#8753e6]" />
          <p className="font-bold">{cityName} собирается</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#756a7d]">
          Когда люди заходят в места, начинают эфиры или общаются в открытых тусовках,
          здесь появляется живая картина города.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 overflow-hidden rounded-[1.6rem] border border-[#2c2036]/10 bg-white text-[#251d31] shadow-[0_12px_30px_rgba(69,43,94,.07)]">
      <div className="border-[#2c2036]/8 flex items-center justify-between border-b px-4 py-3.5">
        <span>
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="size-2 rounded-full bg-[#56d7a4] shadow-[0_0_0_4px_rgba(86,215,164,0.12)]" />
            Сейчас в городе
          </span>
          <span className="mt-0.5 block text-[11px] text-[#81748a]">
            {cityName} · без фейковой активности
          </span>
        </span>
        <Radio className="size-4 text-[#e44883]" />
      </div>
      <div className="divide-[#2c2036]/8 divide-y">
        {items.slice(0, 6).map((item) => {
          const copy = copyForPulse(item);
          const PulseIcon = pulseIcon(item.kind);
          return (
            <Link
              className="group flex items-center gap-3 px-4 py-3 transition hover:bg-[#faf6fd]"
              href={copy.href}
              key={`${item.kind}-${item.actor_id}-${item.target_id}-${item.created_at}`}
            >
              <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff689d] to-[#7756ef] p-0.5 shadow-[0_4px_12px_rgba(121,67,173,.14)]">
                <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f7f1fa] text-xs font-bold text-[#33263d]">
                  {item.actor_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL
                    <img
                      loading="lazy"
                      decoding="async"
                      alt=""
                      className="size-full object-cover"
                      src={item.actor_avatar_url}
                    />
                  ) : (
                    item.actor_name.slice(0, 1).toUpperCase()
                  )}
                </span>
              </span>
              <span className="min-w-0 grow">
                <span className="block truncate text-sm">
                  <b>{item.actor_name}</b>{" "}
                  <span className="text-[#6f6379]">{copy.action}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[10px] text-[#8a7d91]">
                  <PulseIcon className="size-3.5 shrink-0 text-[#8753e6]" />
                  <span className="truncate">{copy.label}</span>
                  <span>· {relativeTime(item.created_at)}</span>
                </span>
              </span>
              {item.kind === "ambassador" && (
                <Sparkles className="size-4 text-[#b57b13]" />
              )}
              {item.kind === "live" && (
                <span className="rounded-full bg-[#ff315c] px-1.5 py-0.5 text-[9px] font-black">
                  LIVE
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
