import Link from "next/link";
import type { Route } from "next";
import {
  CalendarDays,
  MapPin,
  MessageCircle,
  Radio,
  Sparkles,
  UsersRound,
} from "lucide-react";

export type CityPulseItem = {
  city_id: string;
  kind: "presence" | "place_message" | "live" | "event" | "ambassador";
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
  }
}

function pulseIcon(kind: CityPulseItem["kind"]) {
  if (kind === "presence") return MapPin;
  if (kind === "place_message") return MessageCircle;
  if (kind === "event") return CalendarDays;
  if (kind === "live") return Radio;
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
      <section className="mt-5 rounded-[1.5rem] border border-[#8f48ff]/30 bg-gradient-to-r from-[#20152d] to-[#171923] p-4 text-white">
        <div className="flex items-center gap-2">
          <UsersRound className="size-5 text-[#e0a4ff]" />
          <p className="font-bold">{cityName} собирается</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#bcb3c7]">
          Когда люди заходят в места, начинают эфиры или общаются в открытых тусовках,
          здесь появляется живая картина города.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 overflow-hidden rounded-[1.6rem] border border-[#8f48ff]/35 bg-[#171923] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
        <span>
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="size-2 rounded-full bg-[#56d7a4] shadow-[0_0_0_4px_rgba(86,215,164,0.12)]" />
            Сейчас в городе
          </span>
          <span className="mt-0.5 block text-[11px] text-[#a9a0b5]">
            {cityName} · без фейковой активности
          </span>
        </span>
        <Radio className="size-4 text-[#ff82b2]" />
      </div>
      <div className="divide-white/8 divide-y">
        {items.slice(0, 6).map((item) => {
          const copy = copyForPulse(item);
          const PulseIcon = pulseIcon(item.kind);
          return (
            <Link
              className="group flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.045]"
              href={copy.href}
              key={`${item.kind}-${item.actor_id}-${item.target_id}-${item.created_at}`}
            >
              <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff689d] to-[#7756ef] p-0.5">
                <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#2b1d31] text-xs font-bold">
                  {item.actor_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL
                    <img
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
                  <span className="text-[#b8afc4]">{copy.action}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[10px] text-[#9c92a8]">
                  <PulseIcon className="size-3.5 shrink-0 text-[#e0a4ff]" />
                  <span className="truncate">{copy.label}</span>
                  <span>· {relativeTime(item.created_at)}</span>
                </span>
              </span>
              {item.kind === "ambassador" && (
                <Sparkles className="size-4 text-[#ffd35e]" />
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
