import { FieldLabel, inputClassName, textAreaClassName } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
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
    <form
      action={action}
      className="surface rounded-2xl p-5 sm:p-8"
      encType="multipart/form-data"
    >
      {values?.id && <input name="wish_id" type="hidden" value={values.id} />}
      {values?.source_wish_id && (
        <input name="source_wish_id" type="hidden" value={values.source_wish_id} />
      )}
      <div>
        <FieldLabel htmlFor="title">Что вы хотите?</FieldLabel>
        <input
          className={inputClassName}
          defaultValue={values?.title ?? ""}
          id="title"
          maxLength={120}
          name="title"
          placeholder="Например, Sony A7C II"
          required
        />
      </div>
      <div className="mt-5">
        <FieldLabel htmlFor="description" optional>
          Расскажите о желании
        </FieldLabel>
        <textarea
          className={textAreaClassName}
          defaultValue={values?.description ?? ""}
          id="description"
          maxLength={3000}
          name="description"
          placeholder="Почему это важно для вас? Что вы планируете с этим делать?"
        />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="category_slug">Категория</FieldLabel>
          <select
            className={inputClassName}
            defaultValue={values?.category_slug ?? "other"}
            id="category_slug"
            name="category_slug"
          >
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.emoji} {category.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="estimated_cost" optional>
            Примерная стоимость, ₽
          </FieldLabel>
          <input
            className={inputClassName}
            defaultValue={estimatedCost}
            id="estimated_cost"
            inputMode="decimal"
            min="0"
            name="estimated_cost"
            placeholder="150000"
            type="number"
          />
          {values?.estimated_cost_minor ? (
            <p className="mt-1.5 text-xs text-[#9b858c]">
              Сейчас: {formatRubles(values.estimated_cost_minor)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="product_url" optional>
            Ссылка на товар
          </FieldLabel>
          <input
            className={inputClassName}
            defaultValue={values?.product_url ?? ""}
            id="product_url"
            maxLength={2000}
            name="product_url"
            placeholder="https://…"
            type="url"
          />
        </div>
        <div>
          <FieldLabel htmlFor="image" optional>
            Фотография
          </FieldLabel>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-[#725c63] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fce5ec] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#bd3e66] hover:file:bg-[#f8d9e4]"
            id="image"
            name="image"
            type="file"
          />
          <p className="mt-1.5 text-xs text-[#9b858c]">JPG, PNG или WebP, до 10 МБ.</p>
        </div>
      </div>
      <fieldset className="mt-7 border-t border-[#f0e2e6] pt-5">
        <legend className="text-sm font-semibold text-[#5c464d]">
          Кто увидит желание?
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[#f0e2e6] p-3 text-sm text-[#604a52]">
            <input
              defaultChecked={(values?.visibility ?? "public") === "public"}
              name="visibility"
              type="radio"
              value="public"
            />
            <span>
              <b className="block">Публично</b>
              <span className="text-xs text-[#8e747c]">
                Будет видно в вашем профиле.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[#f0e2e6] p-3 text-sm text-[#604a52]">
            <input
              defaultChecked={values?.visibility === "private"}
              name="visibility"
              type="radio"
              value="private"
            />
            <span>
              <b className="block">Только я</b>
              <span className="text-xs text-[#8e747c]">
                Скрыто от других пользователей.
              </span>
            </span>
          </label>
        </div>
      </fieldset>
      <div className="mt-7 flex justify-end border-t border-[#f0e2e6] pt-5">
        <SubmitButton pendingLabel="Сохраняем желание…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
