import {
  BicepsFlexed,
  Cake,
  Car,
  Dumbbell,
  Gem,
  Gift,
  Glasses,
  Heart,
  HeartCrack,
  MicVocal,
  PartyPopper,
  PawPrint,
  Shirt,
  Sparkles,
  Trophy,
  VenetianMask,
  Wand2,
  type LucideIcon,
} from "lucide-react";

/**
 * Semantic icons for gift collections and reasons — the product style is
 * icon-only (no OS emoji, only ⭐ stays as the brand currency). Every
 * collection/reason maps to a Lucide icon; unknown codes fall back to Gift.
 */

const COLLECTION_ICONS: Record<string, LucideIcon> = {
  cute: PawPrint,
  brutal: BicepsFlexed,
  glamour: Gem,
  nerd: Glasses,
  sport: Dumbbell,
  racer: Car,
  street: Shirt,
  beauty: Wand2,
  attention: MicVocal,
  mafia: VenetianMask,
};

export function CollectionIcon({
  slug,
  className,
}: {
  slug: string | null;
  className?: string;
}) {
  const Icon = (slug && COLLECTION_ICONS[slug]) || Gift;
  return <Icon className={className} />;
}

const REASON_ICONS: Record<string, LucideIcon> = {
  birthday: Cake,
  just_because: Sparkles,
  love: Heart,
  sorry: HeartCrack,
  victory: Trophy,
  congrats: PartyPopper,
};

export function ReasonIcon({
  code,
  className,
}: {
  code: string | null | undefined;
  className?: string;
}) {
  const Icon = (code && REASON_ICONS[code]) || Gift;
  return <Icon className={className} />;
}
