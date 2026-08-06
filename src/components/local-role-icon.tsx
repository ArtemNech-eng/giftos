import type { ComponentProps } from "react";
import {
  CalendarDays,
  Camera,
  Coffee,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  Music2,
  Scissors,
  Sparkles,
} from "lucide-react";

export const LOCAL_ROLE_CODES = [
  "beauty",
  "photo",
  "music",
  "fitness",
  "education",
  "events",
  "food",
  "service",
  "other",
] as const;

export type LocalRoleCode = (typeof LOCAL_ROLE_CODES)[number];

export const LOCAL_ROLE_LABELS: Record<LocalRoleCode, string> = {
  beauty: "Красота",
  photo: "Фото и видео",
  music: "Музыка",
  fitness: "Спорт",
  education: "Обучение",
  events: "События",
  food: "Еда и кофе",
  service: "Дело и сервис",
  other: "Другое",
};

const icons = {
  beauty: Scissors,
  photo: Camera,
  music: Music2,
  fitness: Dumbbell,
  education: GraduationCap,
  events: CalendarDays,
  food: Coffee,
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
