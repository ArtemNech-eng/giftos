import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { createPlace } from "@/app/places/actions";
import { PendingButton } from "@/components/pending-button";
import { PLACE_ICON_CODES, PlaceIcon } from "@/components/place-icon";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать место",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const ICON_LABELS: Record<(typeof PLACE_ICON_CODES)[number], string> = {
  center: "Центр",
  music: "Музыка",
  gaming: "Игры",
  night: "Вечер",
  meet: "Люди",
  sport: "Спорт",
  coffee: "Кофе",
  event: "События",
  home: "Свои",
  place: "Другое",
};

export default async function NewPlacePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city, city_id")
    .eq("id", user.id)
    .maybeSingle();
  const hasCity = Boolean(profile?.city_id);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
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
            Городская сцена
          </small>
          <h1 className="mt-0.5 text-sm font-black">Новое место</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <UsersRound className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Sparkles className="size-3.5" /> Собери своих
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          Создай новую
          <br />
          точку города.
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-white/75">
          Место — это живая комната для людей, разговора, эфира и события. Не адрес и не
          сервис бронирования.
        </p>
      </section>

      {!hasCity ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <MapPin className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            Сначала выбери город
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            Место появляется в конкретном городе, поэтому ему нужен твой городской
            контекст.
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#8753e6]"
            href="/settings"
          >
            Выбрать город
          </Link>
        </section>
      ) : (
        <form action={createPlace} className="mt-5 space-y-4">
          <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <label className="block" htmlFor="place-name">
              <span className="text-xs font-black">Как называется место?</span>
              <input
                className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
                id="place-name"
                maxLength={60}
                name="name"
                placeholder="Например, музыка после восьми"
                required
              />
            </label>
            <label className="mt-4 block" htmlFor="place-description">
              <span className="text-[10px] font-black text-[#65596e]">
                Зачем сюда заходят?
              </span>
              <textarea
                className="mt-1.5 min-h-24 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
                id="place-description"
                maxLength={500}
                name="description"
                placeholder="Кого и какой разговор ты хочешь здесь собрать?"
              />
            </label>
          </section>

          <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
                <Sparkles className="size-4" />
              </span>
              <span>
                <h2 className="text-xs font-black">Характер места</h2>
                <p className="mt-0.5 text-[10px] text-[#81748a]">
                  Иконка помогает узнавать точку в городе
                </p>
              </span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {PLACE_ICON_CODES.map((iconCode, index) => (
                <label className="cursor-pointer" key={iconCode}>
                  <input
                    className="peer sr-only"
                    defaultChecked={index === 4}
                    name="icon_code"
                    type="radio"
                    value={iconCode}
                  />
                  <span className="border-[#2c2036]/9 flex min-h-14 flex-col items-center justify-center rounded-xl border bg-[#fbf9fe] text-[#756a7d] transition peer-checked:border-[#a67ae7] peer-checked:bg-[#f0e9ff] peer-checked:text-[#7549d0]">
                    <PlaceIcon className="size-4" code={iconCode} />
                    <span className="mt-1 text-[7px] font-black">
                      {ICON_LABELS[iconCode]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-[#eaf7f5] text-[#258b82]">
                <Clock3 className="size-4" />
              </span>
              <span>
                <h2 className="text-xs font-black">Как долго место живёт?</h2>
                <p className="mt-0.5 text-[10px] text-[#81748a]">
                  Можно собрать свою постоянную тусовку или одну сцену на сегодня
                </p>
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
                <input
                  className="mt-0.5 accent-[#7549d0]"
                  defaultChecked
                  name="kind"
                  type="radio"
                  value="personal"
                />
                <span className="grow">
                  <b className="block text-[10px]">Постоянная тусовка</b>
                  <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                    Комната остаётся в городе и может собирать своих людей.
                  </small>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#fbf9fe] p-3">
                <input
                  className="mt-0.5 accent-[#7549d0]"
                  name="kind"
                  type="radio"
                  value="temporary"
                />
                <span className="grow">
                  <b className="block text-[10px]">Точка на сегодня</b>
                  <small className="mt-1 block text-[9px] leading-4 text-[#81748a]">
                    Временная сцена, которая архивируется через 24 часа.
                  </small>
                </span>
              </label>
            </div>
          </section>

          <section className="flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
            <p className="text-[10px] leading-4">
              Новое место создаётся как открытая городская комната. Точный адрес,
              бронирование услуг и персональная геолокация здесь не публикуются.
            </p>
          </section>

          <PendingButton pendingLabel="Создаём…">
            <UsersRound className="size-4.5" /> Создать место
          </PendingButton>
        </form>
      )}
    </main>
  );
}
