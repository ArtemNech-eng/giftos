import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Hand,
  Flame,
  PenLine,
  Pin,
  Plus,
  Store,
} from "lucide-react";

import {
  bumpService,
  toggleServiceActive,
  toggleServicePin,
} from "@/app/services/actions";
import { ServiceCategoryIcon } from "@/components/service-category-icon";
import { requireUser } from "@/lib/auth";
import { SERVICE_KIND_LABELS, serviceCategory } from "@/lib/service-categories";

export const metadata = {
  title: "Моя витрина",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type MineRow = {
  id: string;
  kind: "service" | "business";
  title: string;
  category_slug: string;
  is_active: boolean;
  pinned_at: string | null;
  views_count: number;
  created_at: string;
};

export default async function MyServicesPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: rawServices }] = await Promise.all([
    supabase.from("profiles").select("city").eq("id", user.id).maybeSingle(),
    supabase
      .from("city_services")
      .select(
        "id, kind, title, category_slug, is_active, pinned_at, views_count, created_at",
      )
      .eq("owner_id", user.id)
      .order("pinned_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);
  const services = (rawServices ?? []) as MineRow[];
  const { data: demandRows } =
    services.length > 0
      ? await supabase.rpc("service_demand_counts", {
          p_ids: services.map((service) => service.id),
        })
      : { data: [] };
  const demandByService = new Map(
    ((demandRows ?? []) as Array<{ service_id: string; cnt: number }>).map((row) => [
      row.service_id,
      Number(row.cnt),
    ]),
  );
  const totalDemand = [...demandByService.values()].reduce(
    (sum, count) => sum + count,
    0,
  );
  const totalViews = services.reduce((sum, service) => sum + service.views_count, 0);
  const activeCount = services.filter((service) => service.is_active).length;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к объявлениям"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/services"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Твой аккаунт · {profile?.city ?? "город"}
          </small>
          <h1 className="mt-0.5 text-sm font-black">Моя витрина</h1>
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
          <Store className="size-3.5" /> Личный кабинет
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.075em]">
          ТВОЯ
          <br />
          ВИТРИНА.
        </h2>
        <p className="mt-3 max-w-64 text-[11px] leading-5 text-white/75">
          Управляй объявлениями, следи за просмотрами и поднимай себя в выдаче — всё в
          одном месте.
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <span className="rounded-2xl bg-black/20 p-2.5">
            <b className="block text-lg leading-none">{services.length}</b>
            <small className="mt-1 block text-[9px] text-white/60">объявлений</small>
          </span>
          <span className="rounded-2xl bg-black/20 p-2.5">
            <b className="block text-lg leading-none">{activeCount}</b>
            <small className="mt-1 block text-[9px] text-white/60">активно</small>
          </span>
          <span className="rounded-2xl bg-black/20 p-2.5">
            <b className="block text-lg leading-none">{totalViews}</b>
            <small className="mt-1 block text-[9px] text-white/60">просмотров</small>
          </span>
          <span className="rounded-2xl bg-black/20 p-2.5">
            <b className="block text-lg leading-none">{totalDemand}</b>
            <small className="mt-1 block text-[9px] text-white/60">ждут</small>
          </span>
        </div>
      </section>

      {services.length === 0 ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <Store className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            Витрина пока пуста
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            Заяви о себе: услуга или заведение — бесплатно и видно только жителям твоего
            города.
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
          {services.map((service) => {
            const category = serviceCategory(service.category_slug);
            const pinned = Boolean(service.pinned_at);
            return (
              <article
                className={`border-[#2c2036]/9 rounded-[1.4rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)] ${
                  pinned ? "border-[#d9b876]" : ""
                }`}
                key={service.id}
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f0e9ff] text-[#8753e6]">
                    <ServiceCategoryIcon
                      className="size-5"
                      code={category?.iconCode ?? "store"}
                    />
                  </span>
                  <span className="min-w-0 grow">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <b className="truncate text-xs">{service.title}</b>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${
                          service.kind === "business"
                            ? "bg-[#fff6d9] text-[#a87511]"
                            : "bg-[#f0e9ff] text-[#7549d0]"
                        }`}
                      >
                        {SERVICE_KIND_LABELS[service.kind]}
                      </span>
                      {pinned && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#201827] px-1.5 py-0.5 text-[8px] font-black text-white">
                          <Pin className="size-2.5" /> Закреплено
                        </span>
                      )}
                    </span>
                    <small className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-[#a093a6]">
                      <Eye className="size-3 text-[#258b82]" /> {service.views_count}
                      {(demandByService.get(service.id) ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff6e8] px-1.5 py-0.5 text-[8px] font-black text-[#a87511]">
                          <Hand className="size-2.5" />{" "}
                          {demandByService.get(service.id)} хотят
                        </span>
                      )}
                      {!service.is_active && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#fdeaea] px-1.5 py-0.5 text-[8px] font-black text-[#c0392b]">
                          <EyeOff className="size-2.5" /> Скрыто
                        </span>
                      )}
                    </small>
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  <form action={toggleServicePin}>
                    <input name="service_id" type="hidden" value={service.id} />
                    <button
                      aria-label={pinned ? "Открепить" : "Закрепить"}
                      className={`grid w-full place-items-center rounded-xl border py-2 ${
                        pinned
                          ? "border-[#201827] bg-[#201827] text-white"
                          : "border-[#2c2036]/10 bg-[#fbf9fe] text-[#5f5369]"
                      }`}
                      title={pinned ? "Открепить" : "Закрепить"}
                      type="submit"
                    >
                      <Pin className="size-3.5" />
                    </button>
                  </form>
                  <form action={bumpService}>
                    <input name="service_id" type="hidden" value={service.id} />
                    <button
                      aria-label="Поднять в выдаче"
                      className="grid w-full place-items-center rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] py-2 text-[#5f5369]"
                      title="Поднять в выдаче"
                      type="submit"
                    >
                      <Flame className="size-3.5 text-[#e2574c]" />
                    </button>
                  </form>
                  <Link
                    aria-label="Редактировать"
                    className="grid w-full place-items-center rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] py-2 text-[#5f5369]"
                    href={`/services/${service.id}/edit` as Route}
                    title="Редактировать"
                  >
                    <PenLine className="size-3.5" />
                  </Link>
                  <form action={toggleServiceActive}>
                    <input name="service_id" type="hidden" value={service.id} />
                    <button
                      aria-label={service.is_active ? "Скрыть" : "Показать"}
                      className="grid w-full place-items-center rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] py-2 text-[#5f5369]"
                      title={service.is_active ? "Скрыть" : "Показать"}
                      type="submit"
                    >
                      {service.is_active ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <Check className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Одно закреплённое объявление всегда вверху категории. «Поднять» возвращает
          объявление в начало выдачи — бесплатно, хоть каждый день.
        </p>
      </section>
    </main>
  );
}
