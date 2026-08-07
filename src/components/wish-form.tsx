import { CircleDollarSign, ImagePlus } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { WishCategoryIcon } from "@/components/wish-category-icon";
import { CATEGORIES } from "@/lib/constants";
import { formatRubles } from "@/lib/money";

type WishValues = {
  id?: string;
  title?: string | null;
  description?: string | null;
  product_url?: string | null;
  estimated_cost_minor?: number | null;
  category_slug?: string | null;
  visibility?: "public" | "private";
  source_wish_id?: string | null;
  image_path?: string | null;
};

export function WishForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: WishValues;
  submitLabel: string;
}) {
  const estimatedCost = values?.estimated_cost_minor
    ? String(Number(values.estimated_cost_minor) / 100)
    : "";

  return (
    <form action={action} className="mt-5 space-y-4" encType="multipart/form-data">
      {values?.id && <input name="wish_id" type="hidden" value={values.id} />}
      {values?.source_wish_id && (
        <input name="source_wish_id" type="hidden" value={values.source_wish_id} />
      )}

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <label className="block" htmlFor="title">
          <span className="text-xs font-black">Что вы хотите?</span>
          <input
            className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
            defaultValue={values?.title ?? ""}
            id="title"
            maxLength={120}
            name="title"
            placeholder="Например, Sony A7C II"
            required
          />
        </label>
        <label className="mt-4 block" htmlFor="description">
          <span className="text-[10px] font-black text-[#65596e]">
            Расскажите о желании
          </span>
          <textarea
            className="mt-1.5 min-h-24 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
            defaultValue={values?.description ?? ""}
            id="description"
            maxLength={3000}
            name="description"
            placeholder="Почему это важно для вас? Что вы планируете с этим делать?"
          />
        </label>
      </section>

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <span>
          <h2 className="text-xs font-black">Категория</h2>
          <p className="mt-0.5 text-[10px] text-[#81748a]">
            Помогает людям находить желание в городе
          </p>
        </span>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {CATEGORIES.map((category) => (
            <label className="cursor-pointer" key={category.slug}>
              <input
                className="peer sr-only"
                defaultChecked={(values?.category_slug ?? "other") === category.slug}
                name="category_slug"
                type="radio"
                value={category.slug}
              />
              <span className="border-[#2c2036]/9 flex min-h-16 flex-col items-center justify-center rounded-xl border bg-[#fbf9fe] px-1 text-center text-[#756a7d] transition peer-checked:border-[#a67ae7] peer-checked:bg-[#f0e9ff] peer-checked:text-[#7549d0]">
                <WishCategoryIcon category={category.slug} className="size-4" />
                <span className="mt-1.5 text-[7px] font-black leading-3">
                  {category.label}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
            <CircleDollarSign className="size-4" />
          </span>
          <span>
            <h2 className="text-xs font-black">Цель и ссылка</h2>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              Необязательно — можно просто оставить мечту
            </p>
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block" htmlFor="estimated_cost">
            <span className="text-[10px] font-black text-[#65596e]">
              Примерная стоимость, ₽
            </span>
            <input
              className="mt-1.5 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              defaultValue={estimatedCost}
              id="estimated_cost"
              inputMode="decimal"
              min="0"
              name="estimated_cost"
              placeholder="150000"
              type="number"
            />
            {values?.estimated_cost_minor ? (
              <p className="mt-1 text-[10px] text-[#9b858c]">
                Сейчас: {formatRubles(values.estimated_cost_minor)}
              </p>
            ) : null}
          </label>
          <label className="block" htmlFor="product_url">
            <span className="text-[10px] font-black text-[#65596e]">
              Ссылка на товар
            </span>
            <input
              className="mt-1.5 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              defaultValue={values?.product_url ?? ""}
              id="product_url"
              maxLength={2000}
              name="product_url"
              placeholder="https://…"
              type="url"
            />
          </label>
        </div>
      </section>

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
            <ImagePlus className="size-4" />
          </span>
          <span>
            <h2 className="text-xs font-black">Фотография</h2>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              JPG, PNG или WebP, до 10 МБ
            </p>
          </span>
        </div>
        <div className="mt-3">
          <input
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-[#725c63] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fce5ec] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#bd3e66] hover:file:bg-[#f8d9e4]"
            id="image"
            name="image"
            type="file"
          />
          {values?.image_path && (
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-[#8e6672]">
              <input name="remove_image" type="checkbox" value="on" />
              Убрать текущее фото
            </label>
          )}
        </div>
      </section>

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <span>
          <h2 className="text-xs font-black">Кто увидит желание?</h2>
          <p className="mt-0.5 text-[10px] text-[#81748a]">
            Приватное желание видно только вам
          </p>
        </span>
        <div className="mt-3 space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
            <input
              className="mt-0.5 accent-[#7549d0]"
              defaultChecked={(values?.visibility ?? "public") === "public"}
              name="visibility"
              type="radio"
              value="public"
            />
            <span className="grow">
              <b className="block text-[10px]">Публично</b>
              <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                Будет видно в вашем профиле и городе.
              </small>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
            <input
              className="mt-0.5 accent-[#7549d0]"
              defaultChecked={values?.visibility === "private"}
              name="visibility"
              type="radio"
              value="private"
            />
            <span className="grow">
              <b className="block text-[10px]">Только я</b>
              <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                Скрыто от других пользователей.
              </small>
            </span>
          </label>
        </div>
      </section>

      <SubmitButton className="w-full" pendingLabel="Сохраняем желание…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
