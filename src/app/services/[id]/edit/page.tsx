import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { updateService } from "@/app/services/actions";
import { PendingButton } from "@/components/pending-button";
import { ServiceCategoryIcon } from "@/components/service-category-icon";
import {
  ServiceFormFields,
  type ServiceFormItem,
} from "@/components/service-form-fields";
import { requireUser } from "@/lib/auth";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";

export const metadata = {
  title: "Редактировать объявление",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type ServiceRow = {
  id: string;
  owner_id: string;
  kind: "service" | "business";
  title: string;
  category_slug: string;
  description: string | null;
  contact_text: string | null;
  address: string | null;
  hours: string | null;
};

type CatalogItem = {
  id: string;
  title: string;
  price: string;
};

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: rawService } = await supabase
    .from("city_services")
    .select("id, owner_id, kind, title, category_slug, description, contact_text")
    .eq("id", id)
    .maybeSingle();
  const service = rawService as ServiceRow | null;
  if (!service || service.owner_id !== user.id) notFound();

  const { data: rawItems } = await supabase
    .from("service_catalog_items")
    .select("id, title, price")
    .eq("service_id", service.id)
    .order("sort_order", { ascending: true })
    .limit(8);
  const items: ServiceFormItem[] = ((rawItems ?? []) as CatalogItem[]).map((item) => ({
    title: item.title,
    price: item.price,
  }));

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к объявлению"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href={`/services/${service.id}`}
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Городская витрина
          </small>
          <h1 className="mt-0.5 text-sm font-black">Редактировать</h1>
        </span>
        <span className="w-10" />
      </header>

      <form action={updateService} className="mt-5 space-y-4">
        <input name="service_id" type="hidden" value={service.id} />
        <ServiceFormFields
          address={service.address}
          hours={service.hours}
          initialKind={service.kind}
          items={items}
        />

        <section className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <label className="block text-[11px] font-black" htmlFor="service-title">
            Название
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-semibold outline-none"
            defaultValue={service.title}
            id="service-title"
            maxLength={80}
            name="title"
            required
          />
        </section>

        <section className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <b className="block text-[11px]">Категория</b>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SERVICE_CATEGORIES.map((category) => (
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-bold ${
                  service.category_slug === category.slug
                    ? "border-[#a67ae7] bg-[#f0e9ff] text-[#7549d0]"
                    : "border-[#2c2036]/10 bg-[#fbf9fe] text-[#5f5369]"
                }`}
                key={category.slug}
              >
                <input
                  className="accent-[#7549d0]"
                  defaultChecked={service.category_slug === category.slug}
                  name="category_slug"
                  required
                  type="radio"
                  value={category.slug}
                />
                <ServiceCategoryIcon
                  className="size-4 text-[#8753e6]"
                  code={category.iconCode}
                />
                {category.label}
              </label>
            ))}
          </div>
        </section>

        <section className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <label className="block text-[11px] font-black" htmlFor="service-desc">
            О себе или месте
          </label>
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] p-3 text-xs leading-5 outline-none"
            defaultValue={service.description ?? ""}
            id="service-desc"
            maxLength={1500}
            name="description"
          />
          <label
            className="mt-3 block text-[11px] font-black"
            htmlFor="service-contact"
          >
            Как связаться
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-semibold outline-none"
            defaultValue={service.contact_text ?? ""}
            id="service-contact"
            maxLength={200}
            name="contact_text"
          />
          <label className="mt-3 block text-[11px] font-black" htmlFor="service-photos">
            Фото (до 3)
          </label>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 w-full rounded-xl border border-dashed border-[#cdbbe7] bg-[#fbf9fe] px-3 py-3 text-[10px] font-semibold text-[#756a7d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f0e9ff] file:px-3 file:py-1.5 file:text-[10px] file:font-black file:text-[#7549d0]"
            id="service-photos"
            multiple
            name="photos"
            type="file"
          />
          <small className="mt-1.5 block text-[9px] leading-4 text-[#a093a6]">
            Загрузи новые фото — они заменят текущие. JPG, PNG или WebP.
          </small>
        </section>

        <PendingButton pendingLabel="Сохраняем…">Сохранить</PendingButton>
      </form>
    </main>
  );
}
