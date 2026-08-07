import type { ComponentProps } from "react";
import {
  Award,
  BadgeCheck,
  Flame,
  Flower2,
  Frame,
  Moon,
  Palette,
  Rainbow,
  Rocket,
  Sparkles,
  Star,
  Waves,
  Zap,
} from "lucide-react";

const icons = {
  fire: Flame,
  star: Star,
  rose: Flower2,
  neon: Zap,
  sparkle: Sparkles,
  flame: Flame,
  night: Moon,
  space: Rocket,
  wave: Waves,
  gold: Award,
  rainbow: Rainbow,
  frame: Frame,
  palette: Palette,
} as const;

export type VirtualItemIconCode = keyof typeof icons;

const typeFallbacks: Record<string, VirtualItemIconCode> = {
  badge: "star",
  avatar_frame: "frame",
  effect: "sparkle",
  profile_theme: "palette",
};

/** Product-native shop item icon. Never falls back to an OS emoji. */
export function VirtualItemIcon({
  code,
  itemType,
  ...props
}: ComponentProps<typeof Star> & {
  code: string | null | undefined;
  itemType?: string | null;
}) {
  const resolved =
    (code as VirtualItemIconCode | undefined) ??
    (itemType ? typeFallbacks[itemType] : undefined) ??
    "star";
  const Icon = icons[resolved] ?? BadgeCheck;
  return <Icon aria-hidden="true" {...props} />;
}
