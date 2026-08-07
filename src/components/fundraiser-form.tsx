import { CalendarDays, EyeOff, ImagePlus, Link2, Lock, Target } from "lucide-react";

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
    <form action={action} className="mt-5 space-y-4" encType="multipart/form-data">
      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <label className="block" htmlFor="fundraiser-title">
          <span className="text-xs font-black">Какая общая цель?</span>
          <input
            className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
            id="fundraiser-title"
            maxLength={120}
            name="title"
            placeholder="Например, собрать домашнюю студию"
            required
          />
        </label>
        <label className="mt-4 block" htmlFor="fundraiser-description">
          <span className="text-[10px] font-black text-[#65596e]">
            Почему это важно?
          </span>
          <textarea
            className="mt-1.5 min-h-28 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
            id="fundraiser-description"
            maxLength={5000}
            name="description"
            placeholder="Расскажи историю цели и что изменится, когда она получится."
          />
        </label>
      </section>

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
            <Target className="size-4" />
          </span>
          <span>
            <h2 className="text-xs font-black">Цель и контекст</h2>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              Сбор может продолжать желание, но не обязан
            </p>
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block" htmlFor="fundraiser-amount">
            <span className="text-[10px] font-black text-[#65596e]">Цель, ₽</span>
            <input
              className="mt-1.5 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-bold outline-none placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              id="fundraiser-amount"
              inputMode="decimal"
              min="1"
              name="target_amount"
              placeholder="65 000"
              required
              type="number"
            />
          </label>
          <label className="block" htmlFor="fundraiser-ends">
            <span className="text-[10px] font-black text-[#65596e]">Срок</span>
            <span className="mt-1.5 flex items-center rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-[#887a92] focus-within:border-[#b28be8]">
              <CalendarDays className="size-4 shrink-0 text-[#8753e6]" />
              <input
                className="min-w-0 grow bg-transparent py-3 pl-2 text-xs font-bold outline-none"
                id="fundraiser-ends"
                name="ends_at"
                type="datetime-local"
              />
            </span>
            <small className="mt-1.5 block text-[9px] leading-4 text-[#8a7d91]">
              Необязательно
            </small>
          </label>
        </div>
        <label className="mt-4 block" htmlFor="fundraiser-wish">
          <span className="text-[10px] font-black text-[#65596e]">
            Связать с желанием
          </span>
          <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-[#887a92]">
            <Link2 className="size-4 shrink-0 text-[#8753e6]" />
            <select
              className="min-w-0 grow appearance-none bg-transparent py-3 text-xs font-bold outline-none"
              id="fundraiser-wish"
              name="wish_id"
            >
              <option value="">Новая самостоятельная цель</option>
              {wishes.map((wish) => (
                <option key={wish.id} value={wish.id}>
                  {wish.title}
                </option>
              ))}
            </select>
          </span>
        </label>
        <label className="mt-4 block" htmlFor="fundraiser-category">
          <span className="text-[10px] font-black text-[#65596e]">Категория</span>
          <select
            className="mt-1.5 w-full appearance-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-bold outline-none focus:border-[#b28be8]"
            defaultValue="other"
            id="fundraiser-category"
            name="category_slug"
          >
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#eaf7f5] text-[#258b82]">
            <ImagePlus className="size-4" />
          </span>
          <span>
            <h2 className="text-xs font-black">Обложка</h2>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              Необязательна — история важнее картинки
            </p>
          </span>
        </div>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="mt-4 block w-full rounded-xl border border-dashed border-[#cdbbe7] bg-[#fbf9fe] p-3 text-[10px] text-[#756a7d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f0e9ff] file:px-3 file:py-2 file:text-[10px] file:font-black file:text-[#7549d0]"
          id="fundraiser-cover"
          name="cover_image"
          type="file"
        />
        <small className="mt-1.5 block text-[9px] text-[#8a7d91]">
          JPG, PNG или WebP, до 10 МБ.
        </small>
      </section>

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <h2 className="text-xs font-black">Кто увидит сбор?</h2>
        <div className="mt-3 space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
            <input
              className="mt-0.5 accent-[#7549d0]"
              defaultChecked
              name="visibility"
              type="radio"
              value="public"
            />
            <span className="grow">
              <b className="block text-[10px]">Публичный</b>
              <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                История доступна в открытой части приложения.
              </small>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
            <input
              className="mt-0.5 accent-[#7549d0]"
              name="visibility"
              type="radio"
              value="unlisted"
            />
            <span className="grid size-7 place-items-center rounded-lg bg-white text-[#8753e6]">
              <Link2 className="size-3.5" />
            </span>
            <span className="grow">
              <b className="block text-[10px]">По ссылке</b>
              <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                Не появляется в общей выдаче.
              </small>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
            <input
              className="mt-0.5 accent-[#7549d0]"
              name="visibility"
              type="radio"
              value="private"
            />
            <span className="grid size-7 place-items-center rounded-lg bg-white text-[#8753e6]">
              <Lock className="size-3.5" />
            </span>
            <span className="grow">
              <b className="block text-[10px]">Приватный</b>
              <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                Доступ получат только приглашённые тобой люди.
              </small>
            </span>
          </label>
        </div>
        <p className="mt-3 flex gap-2 rounded-xl bg-[#fff7e8] p-3 text-[10px] leading-4 text-[#896a27]">
          <EyeOff className="mt-0.5 size-3.5 shrink-0" />
          Публичность можно изменить позже. Приватный сбор не попадёт в общую городскую
          сцену.
        </p>
      </section>

      <section className="flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <Lock className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Публикация создаёт цель и безопасный test-mode путь поддержки. Реальные деньги
          сейчас не списываются.
        </p>
      </section>

      <SubmitButton
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)]"
        pendingLabel="Создаём сбор…"
      >
        <Target className="size-4.5" /> Опубликовать сбор
      </SubmitButton>
    </form>
  );
}
