/**
 * Service/venue categories for the city marketplace — mirrors the
 * service_categories table seed (icon_code values map to Lucide icons in
 * the UI, no OS emoji).
 */
export const SERVICE_CATEGORIES = [
  { slug: "beauty", label: "Красота", iconCode: "sparkles" },
  { slug: "health", label: "Здоровье", iconCode: "heartpulse" },
  { slug: "repair", label: "Ремонт", iconCode: "wrench" },
  { slug: "education", label: "Обучение", iconCode: "graduationcap" },
  { slug: "events", label: "Организация", iconCode: "calendardays" },
  { slug: "food", label: "Еда и напитки", iconCode: "coffee" },
  { slug: "transport", label: "Транспорт", iconCode: "car" },
  { slug: "other", label: "Другое", iconCode: "store" },
] as const;

export type ServiceCategorySlug = (typeof SERVICE_CATEGORIES)[number]["slug"];

export const serviceCategory = (slug: string | null | undefined) =>
  SERVICE_CATEGORIES.find((category) => category.slug === slug) ?? null;

export const SERVICE_KIND_LABELS: Record<string, string> = {
  service: "Услуга",
  business: "Заведение",
};
