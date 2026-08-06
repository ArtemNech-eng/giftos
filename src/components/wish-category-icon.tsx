import type { ComponentProps } from "react";
import {
  CarFront,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  House,
  Laptop,
  Music2,
  Palette,
  PartyPopper,
  Plane,
  Scissors,
  Shirt,
  Sparkles,
  Ticket,
} from "lucide-react";

const icons = {
  electronics: Laptop,
  travel: Plane,
  sport: Dumbbell,
  music: Music2,
  games: Gamepad2,
  hobbies: Palette,
  education: GraduationCap,
  clothes: Shirt,
  beauty: Scissors,
  cars: CarFront,
  home: House,
  experiences: Ticket,
  holidays: PartyPopper,
  other: Sparkles,
} as const;

/** Product-native category icon for wishes. Never falls back to an OS emoji. */
export function WishCategoryIcon({
  category,
  ...props
}: ComponentProps<typeof Sparkles> & { category: string | null | undefined }) {
  const Icon = icons[(category ?? "other") as keyof typeof icons] ?? Sparkles;
  return <Icon aria-hidden="true" {...props} />;
}
