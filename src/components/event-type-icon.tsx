import type { ComponentProps } from "react";
import {
  CalendarDays,
  Footprints,
  Gamepad2,
  Music2,
  Radio,
  Sparkles,
  UsersRound,
} from "lucide-react";

export const EVENT_TYPES = [
  "meetup",
  "walk",
  "game",
  "concert",
  "stream",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meetup: "Встреча",
  walk: "Прогулка",
  game: "Игра",
  concert: "Музыка и сцена",
  stream: "Совместный эфир",
  other: "Другое",
};

const icons = {
  meetup: UsersRound,
  walk: Footprints,
  game: Gamepad2,
  concert: Music2,
  stream: Radio,
  other: Sparkles,
} as const;

export function getEventTypeLabel(type: string | null | undefined) {
  return EVENT_TYPE_LABELS[(type ?? "other") as EventType] ?? EVENT_TYPE_LABELS.other;
}

/** Product-native event icon. Never falls back to an OS emoji. */
export function EventTypeIcon({
  type,
  ...props
}: ComponentProps<typeof CalendarDays> & {
  type: string | null | undefined;
}) {
  const Icon = icons[(type ?? "other") as EventType] ?? CalendarDays;
  return <Icon aria-hidden="true" {...props} />;
}
