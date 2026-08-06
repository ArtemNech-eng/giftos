import type { ComponentProps } from "react";
import {
  BusFront,
  CalendarDays,
  Camera,
  Clapperboard,
  Coffee,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Megaphone,
  Music2,
  Scissors,
  Sparkles,
  Stethoscope,
  Store,
} from "lucide-react";

export const LOCAL_ROLE_CODES = [
  "creator",
  "beauty",
  "photo",
  "music",
  "fitness",
  "education",
  "events",
  "food",
  "transport",
  "retail",
  "film",
  "health",
  "public",
  "service",
  "other",
] as const;

export type LocalRoleCode = (typeof LOCAL_ROLE_CODES)[number];

export const LOCAL_ROLE_LABELS: Record<LocalRoleCode, string> = {
  creator: "Автор / блогер",
  beauty: "Красота",
  photo: "Фото и видео",
  music: "Музыка",
  fitness: "Спорт",
  education: "Обучение",
  events: "События",
  food: "Еда и кофе",
  transport: "Транспорт",
  retail: "Торговля",
  film: "Кино и культура",
  health: "Здоровье",
  public: "Публичная жизнь",
  service: "Дело и сервис",
  other: "Другое",
};

const icons = {
  creator: Megaphone,
  beauty: Scissors,
  photo: Camera,
  music: Music2,
  fitness: Dumbbell,
  education: GraduationCap,
  events: CalendarDays,
  food: Coffee,
  transport: BusFront,
  retail: Store,
  film: Clapperboard,
  health: Stethoscope,
  public: Landmark,
  service: HeartHandshake,
  other: Sparkles,
} as const;

export function LocalRoleIcon({
  code,
  ...props
}: ComponentProps<typeof Sparkles> & { code: string | null | undefined }) {
  const Icon = icons[(code ?? "other") as LocalRoleCode] ?? Sparkles;
  return <Icon aria-hidden="true" {...props} />;
}
