import Link from "next/link";
import { ArrowLeft, Briefcase, Sparkles } from "lucide-react";

import { createService } from "@/app/services/actions";
import { ServiceFormFields } from "@/components/service-form-fields";
import { ServiceCategoryIcon } from "@/components/service-category-icon";
import { requireUser } from "@/lib/auth";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";

export const metadata = {
  title: "Добавить объявление",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city, city_id")
    .eq("id", user.id)
    .maybeSingle();
  const hasCity = Boolean(profile?.city_id);
  const cityName = profile?.city ?? "Твой город";

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
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
            Городская витрина
          </small>
          <h1 className="mt-0.5 text-sm font-black">Новое объявление</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Briefcase className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#2e2250] via-[#4d3572] to-[#7559d5] p-5 text-white shadow-[0_14px_32px_rgba(63,37,98,.22)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#ffc3da]">
          <Sparkles className="size-3.5" /> {cityName} · бесплатно
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.075em]">
          ЗАЯВИ
          <br />
          СЕБЯ В ГОРОДЕ.
        </h2>
        <p className="mt-3 max-w-64 text-[11px] leading-5 text-white/75">
          Маникюр, ремонт, своё кафе — расскажи, чем ты полезен городу. Объявление
          увидят только жители твоего города.
        </p>
      </section>

      <form action={createService} className="mt-5 space-y-4">
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
          <label
            className="mt-3 block text-[11px] font-black"
            htmlFor="service-contact"
          >
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

        {!hasCity ? (
          <p className="rounded-xl bg-[#fff7e8] p-3 text-[10px] leading-4 text-[#896a27]">
            Сначала укажи город в настройках профиля — объявление появится в его
            витрине.
          </p>
        ) : (
          <button
            className="w-full rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)]"
            type="submit"
          >
            Опубликовать бесплатно
          </button>
        )}
      </form>
    </main>
  );
}
