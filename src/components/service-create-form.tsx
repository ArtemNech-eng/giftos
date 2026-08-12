"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";

import { createService, type ServiceActionState } from "@/app/services/actions";
import { PendingButton } from "@/components/pending-button";
import { ServiceCategoryIcon } from "@/components/service-category-icon";
import { ServiceFormFields } from "@/components/service-form-fields";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";

/**
 * Create-listing form with inline errors: validation failures render as a
 * red banner inside the form (nothing is lost, no route-level error page).
 */
export function ServiceCreateForm() {
  const [state, formAction] = useActionState<ServiceActionState, FormData>(
    createService,
    null,
  );

  return (
    <form action={formAction} className="mt-5 space-y-4">
      {state?.error && (
        <div
          className="flex items-start gap-2 rounded-2xl border border-[#f0c8c8] bg-[#fff5f5] p-3.5 text-[#c0392b]"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="text-[11px] font-bold leading-4">{state.error}</p>
        </div>
      )}

      <ServiceFormFields initialKind="service" />

      <section className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <label className="block text-[11px] font-black" htmlFor="service-title">
          Название
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-semibold outline-none placeholder:text-[#aaa0ae]"
          id="service-title"
          maxLength={80}
          name="title"
          placeholder="Маникюр у ДК / Кофейня «Утро»"
          required
        />
      </section>

      <section className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Категория</b>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SERVICE_CATEGORIES.map((category) => (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-2.5 text-[10px] font-bold text-[#5f5369]"
              key={category.slug}
            >
              <input
                className="accent-[#7549d0]"
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
          className="mt-2 min-h-24 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] p-3 text-xs leading-5 outline-none placeholder:text-[#aaa0ae]"
          id="service-desc"
          maxLength={1500}
          name="description"
          placeholder="Что делаешь, где находишься, почему к тебе стоит прийти…"
        />
        <label className="mt-3 block text-[11px] font-black" htmlFor="service-contact">
          Как связаться
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-semibold outline-none placeholder:text-[#aaa0ae]"
          id="service-contact"
          maxLength={200}
          name="contact_text"
          placeholder="Телефон или @telegram — по желанию"
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
          Первое фото станет обложкой. JPG, PNG или WebP, до 10 МБ.
        </small>
      </section>

      <PendingButton pendingLabel="Публикуем…">Опубликовать бесплатно</PendingButton>
    </form>
  );
}
