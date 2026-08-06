import type { ComponentProps } from "react";
import {
  CalendarDays,
  Coffee,
  Dumbbell,
  Gamepad2,
  House,
  MapPin,
  MapPinned,
  Moon,
  Music2,
  UsersRound,
} from "lucide-react";

export const PLACE_ICON_CODES = [
  "center",
  "music",
  "gaming",
  "night",
  "meet",
  "sport",
  "coffee",
  "event",
  "home",
  "place",
] as const;

export type PlaceIconCode = (typeof PLACE_ICON_CODES)[number];

const icons = {
  center: MapPin,
  music: Music2,
  gaming: Gamepad2,
  night: Moon,
  meet: UsersRound,
  sport: Dumbbell,
  coffee: Coffee,
  event: CalendarDays,
  home: House,
  place: MapPinned,
} as const;

/** Product-native place icon. Never falls back to an OS emoji. */
export function PlaceIcon({
  code,
  ...props
}: ComponentProps<typeof MapPin> & { code: string | null | undefined }) {
  const Icon = icons[(code ?? "place") as PlaceIconCode] ?? MapPinned;
  return <Icon aria-hidden="true" {...props} />;
}
