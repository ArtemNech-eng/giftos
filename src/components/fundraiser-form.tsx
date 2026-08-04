import { FieldLabel, inputClassName, textAreaClassName } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { CATEGORIES } from "@/lib/constants";

export function FundraiserForm({
  action,
  wishes,
}: {
  action: (formData: FormData) => void | Promise<void>;
  wishes: Array<{ id: string; title: string; category_slug: string | null }>;
}) {
  return (
    <form
      action={action}
      className="surface rounded-2xl p-5 sm:p-8"
      encType="multipart/form-data"
    >
      <div>
        <FieldLabel htmlFor="title">На что собираете?</FieldLabel>
        <input
          className={inputClassName}
          id="title"
          maxLength={120}
          name="title"
          placeholder="Например, MacBook Pro для работы"
          required
        />
      </div>
      <div className="mt-5">
        <FieldLabel htmlFor="description" optional>
          Почему это важно?
        </FieldLabel>
        <textarea
          className={textAreaClassName}
          id="description"
          maxLength={5000}
          name="description"
          placeholder="Расскажите историю — это поможет людям понять и поддержать вашу цель."
        />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="target_amount">Сколько нужно, ₽</FieldLabel>
          <input
            className={inputClassName}
            id="target_amount"
            inputMode="decimal"
            min="1"
            name="target_amount"
            placeholder="150000"
            required
            type="number"
          />
        </div>
        <div>
          <FieldLabel htmlFor="ends_at" optional>
            Срок сбора
          </FieldLabel>
          <input
            className={inputClassName}
            id="ends_at"
            name="ends_at"
            type="datetime-local"
          />
          <p className="mt-1.5 text-xs text-[#9b858c]">
            Оставьте пустым для бессрочного сбора.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="wish_id" optional>
            Связать с желанием
          </FieldLabel>
          <select className={inputClassName} id="wish_id" name="wish_id">
            <option value="">Не связывать</option>
            {wishes.map((wish) => (
              <option key={wish.id} value={wish.id}>
                {wish.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="category_slug">Категория</FieldLabel>
          <select
            className={inputClassName}
            defaultValue="other"
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
      </div>
      <div className="mt-5">
        <FieldLabel htmlFor="cover_image" optional>
          Главная фотография
        </FieldLabel>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-[#725c63] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fce5ec] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#bd3e66] hover:file:bg-[#f8d9e4]"
          id="cover_image"
          name="cover_image"
          type="file"
        />
        <p className="mt-1.5 text-xs text-[#9b858c]">JPG, PNG или WebP, до 10 МБ.</p>
      </div>
      <fieldset className="mt-7 border-t border-[#f0e2e6] pt-5">
        <legend className="text-sm font-semibold text-[#5c464d]">
          Кто увидит сбор?
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[#f0e2e6] p-3 text-sm text-[#604a52]">
            <input defaultChecked name="visibility" type="radio" value="public" />
            <span>
              <b className="block">Публичный</b>
              <span className="text-xs text-[#8e747c]">В ленте и поиске.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[#f0e2e6] p-3 text-sm text-[#604a52]">
            <input name="visibility" type="radio" value="unlisted" />
            <span>
              <b className="block">По ссылке</b>
              <span className="text-xs text-[#8e747c]">Не в ленте.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[#f0e2e6] p-3 text-sm text-[#604a52]">
            <input name="visibility" type="radio" value="private" />
            <span>
              <b className="block">Приватный</b>
              <span className="text-xs text-[#8e747c]">Для приглашённых.</span>
            </span>
          </label>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#9b858c]">
          Приглашение участников для приватных сборов будет добавлено на следующем
          срезе. Пока приватный сбор доступен только вам.
        </p>
      </fieldset>
      <div className="mt-7 flex justify-end border-t border-[#f0e2e6] pt-5">
        <SubmitButton pendingLabel="Публикуем сбор…">Опубликовать сбор</SubmitButton>
      </div>
    </form>
  );
}
