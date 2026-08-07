import type { ComponentProps } from "react";
import { Crown, Heart, PawPrint, Star, Zap } from "lucide-react";

const icons = {
  paw: PawPrint,
  crown: Crown,
  zap: Zap,
  heart: Heart,
  star: Star,
} as const;

export type PlaceEmblemIconCode = keyof typeof icons;

/** Product-native place emblem icon. Never falls back to an OS emoji. */
export function PlaceEmblemIcon({
  code,
  ...props
}: ComponentProps<typeof Star> & { code: string | null | undefined }) {
  const Icon = icons[(code ?? "star") as PlaceEmblemIconCode] ?? Star;
  return <Icon aria-hidden="true" {...props} />;
}
