import {
  CalendarDays,
  Car,
  Coffee,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  heartpulse: HeartPulse,
  wrench: Wrench,
  graduationcap: GraduationCap,
  calendardays: CalendarDays,
  coffee: Coffee,
  car: Car,
  store: Store,
};

export function ServiceCategoryIcon({
  code,
  className,
}: {
  code: string | null | undefined;
  className?: string;
}) {
  const Icon = (code && ICONS[code]) || Store;
  return <Icon className={className} />;
}
