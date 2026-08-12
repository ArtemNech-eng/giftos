import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeft,
  Briefcase,
  ChevronRight,
  MapPin,
  Plus,
  Sparkles,
  Store,
} from "lucide-react";

import { ServiceCategoryIcon } from "@/components/service-category-icon";
import { requireUser } from "@/lib/auth";
import { SERVICE_CATEGORIES, SERVICE_KIND_LABELS } from "@/lib/service-categories";

export const metadata = {
  title: "Услуги и заведения города",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type ServiceRow = {
  id: string;
  kind: "service" | "business";
  title: string;
  category_slug: string;
  description: string | null;
  contact_text: string | null;
  created_at: string;
  owner_display_name: string;
  owner_username: string;
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory = "" } = await searchParams;
  const activeCategory = SERVICE_CATEGORIES.some(
    (category) => category.slug === rawCategory,
  )
    ? rawCategory
    : "";
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();
  const hasCity = Boolean(profile?.city_id);

  let services: ServiceRow[] = [];
  if (hasCity) {
    const query = supabase
      .from("public_city_services")
      .select(
        "id, kind, title, category_slug, description, contact_text, created_at, owner_display_name, owner_username",
      )
      .eq("city_id", profile!.city_id!)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(60);
    if (activeCategory) query.eq("category_slug", activeCategory);
    const { data } = await query;
    services = (data ?? []) as ServiceRow[];
  }

  const cityName = profile?.city ?? "Твой город";

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-24 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться в город"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/places"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            {cityName}
          </small>
          <h1 className="mt-0.5 text-sm font-black">Услуги и заведения</h1>
        </span>
        <Link
          aria-label="Добавить объявление"
          className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-white shadow-[0_7px_16px_rgba(160,75,213,.24)]"
          href="/services/new"
        >
          <Plus className="size-5" />
        </Link>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#2e2250] via-[#4d3572] to-[#7559d5] p-5 text-white shadow-[0_14px_32px_rgba(63,37,98,.22)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#ffc3da]">
          <Store className="size-3.5" /> Свои исполнители
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.075em]">
          КТО ЧТО ДЕЛАЕТ
          <br />В ГОРОДЕ.
        </h2>
        <p className="mt-3 max-w-64 text-[11px] leading-5 text-white/75">
          Мастера, специалисты и заведения {cityName} — одним списком. Без рекламы всей
          страны: только свои, только рядом.
        </p>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black">
            {services.length} объявлений
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black">
            пока бесплатно
          </span>
        </div>
      </section>

      <nav className="scrollbar-none -mx-4 mt-5 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <Link
          className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black transition ${
            !activeCategory
              ? "bg-gradient-to-r from-[#8254ed] to-[#ff5d9a] text-white shadow-[0_4px_12px_rgba(160,75,213,.3)]"
              : "border border-[#2c2036]/10 bg-white text-[#756a7d]"
          }`}
          href="/services"
        >
          Все
        </Link>
        {SERVICE_CATEGORIES.map((category) => (
          <Link
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black transition ${
              activeCategory === category.slug
                ? "bg-gradient-to-r from-[#8254ed] to-[#ff5d9a] text-white shadow-[0_4px_12px_rgba(160,75,213,.3)]"
                : "border border-[#2c2036]/10 bg-white text-[#756a7d]"
            }`}
            href={`/services?category=${category.slug}` as Route}
            key={category.slug}
          >
            <ServiceCategoryIcon className="size-3.5" code={category.iconCode} />
            {category.label}
          </Link>
        ))}
      </nav>

      {!hasCity ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <MapPin className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            Сначала выбери город
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            Тогда здесь появятся услуги и заведения рядом с тобой.
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#8753e6]"
            href="/settings"
          >
            Выбрать город <ChevronRight className="size-4" />
          </Link>
        </section>
      ) : services.length === 0 ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <Briefcase className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            {activeCategory ? "В этой категории пока пусто" : "Город только собирается"}
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            {activeCategory
              ? "Объявления появятся, как только мастера заявят себя."
              : "Будь первым: расскажи, что ты делаешь, — бесплатно."}
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(160,75,213,.24)]"
            href="/services/new"
          >
            <Plus className="size-4" /> Добавить объявление
          </Link>
        </section>
      ) : (
        <div className="mt-5 space-y-2.5">
          {services.map((service) => (
            <Link
              className="border-[#2c2036]/9 flex items-start gap-3 rounded-[1.4rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
              href={`/services/${service.id}` as Route}
              key={service.id}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f0e9ff] text-[#8753e6]">
                <ServiceCategoryIcon
                  className="size-5"
                  code={
                    SERVICE_CATEGORIES.find(
                      (category) => category.slug === service.category_slug,
                    )?.iconCode
                  }
                />
              </span>
              <span className="min-w-0 grow">
                <span className="flex items-center gap-2">
                  <b className="truncate text-xs">{service.title}</b>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black ${
                      service.kind === "business"
                        ? "bg-[#fff6d9] text-[#a87511]"
                        : "bg-[#f0e9ff] text-[#7549d0]"
                    }`}
                  >
                    {SERVICE_KIND_LABELS[service.kind]}
                  </span>
                </span>
                {service.description && (
                  <small className="mt-1 line-clamp-2 block text-[10px] leading-4 text-[#81748a]">
                    {service.description}
                  </small>
                )}
                <small className="mt-1.5 flex items-center gap-1.5 text-[9px] font-bold text-[#a093a6]">
                  <Sparkles className="size-3 text-[#8753e6]" />
                  {service.owner_display_name}
                  {service.contact_text ? ` · ${service.contact_text}` : ""}
                </small>
              </span>
              <ChevronRight className="mt-1 size-4 shrink-0 text-[#a295a8]" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
