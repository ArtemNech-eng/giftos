import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { createEvent } from "@/app/events/actions";
import { PendingButton } from "@/components/pending-button";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/components/event-type-icon";
import { PlaceIcon } from "@/components/place-icon";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать событие",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type PlaceOption = { id: string; name: string; icon_code: string | null };

export default async function NewEventPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();

  const { data: rawPlaces } = profile?.city_id
    ? await supabase
        .from("places")
        .select("id, name, icon_code")
        .eq("city_id", profile.city_id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(100)
    : { data: [] };
  const places = (rawPlaces ?? []) as PlaceOption[];
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const hasCity = Boolean(profile?.city_id);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Назад к событиям"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/events"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Городская сцена
          </small>
          <h1 className="mt-0.5 text-sm font-black">Новое событие</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#eee8f5] text-[#8753e6]">
          <CalendarDays className="size-5" />
        </span>
      </header>

      <section className="mt-5 rounded-[1.7rem] bg-gradient-to-br from-[#fff5fb] to-[#eee8ff] p-5 shadow-[0_10px_25px_rgba(69,43,94,.07)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8753e6]">
          <UsersRound className="size-3.5" /> Собрать своих
        </span>
        <h2 className="mt-3 text-2xl font-black leading-[0.92] tracking-[-0.065em]">
          Дай городу
          <br />
          повод встретиться.
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-[#756a7d]">
          Событие увидят только там, где ты его открываешь. Участие всегда добровольное.
        </p>
      </section>

      {!hasCity && (
        <section className="mt-4 flex items-start gap-3 rounded-2xl border border-[#e4d3f3] bg-[#fffaff] p-4 text-[#5f526a]">
          <MapPin className="mt-0.5 size-5 shrink-0 text-[#8753e6]" />
          <span>
            <b className="block text-xs">Город пока не выбран</b>
            <span className="mt-1 block text-[10px] leading-4 text-[#81748a]">
              Можно создать открытое событие. Для городской программы сначала выбери
              свой город.
            </span>
            <Link
              className="mt-2 inline-block text-[10px] font-black text-[#8753e6]"
              href="/onboarding"
            >
              Выбрать город →
            </Link>
          </span>
        </section>
      )}

      <form action={createEvent} className="mt-5 space-y-4">
        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <label className="block" htmlFor="event-title">
            <span className="text-xs font-black">Как называется встреча?</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              id="event-title"
              maxLength={120}
              name="title"
              placeholder="Например, вечерняя прогулка у ДК"
              required
            />
          </label>
          <label className="mt-4 block" htmlFor="event-description">
            <span className="text-xs font-black">Что будет происходить?</span>
            <textarea
              className="mt-2 min-h-28 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none transition placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              id="event-description"
              maxLength={2000}
              name="description"
              placeholder="Расскажи идею и настроение встречи. Не публикуй личные контакты и точные адреса — для города достаточно контекста места."
            />
          </label>
        </section>

        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
              <CalendarDays className="size-4" />
            </span>
            <span>
              <h2 className="text-xs font-black">Формат и время</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Чтобы людям было легко решиться
              </p>
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block" htmlFor="event-type">
              <span className="text-[10px] font-black text-[#65596e]">Формат</span>
              <select
                className="mt-1.5 w-full appearance-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-bold outline-none focus:border-[#b28be8]"
                defaultValue="meetup"
                id="event-type"
                name="event_type"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {EVENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block" htmlFor="event-start">
              <span className="text-[10px] font-black text-[#65596e]">Начало</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-bold outline-none focus:border-[#b28be8]"
                id="event-start"
                min={minDate}
                name="starts_at"
                required
                type="datetime-local"
              />
            </label>
          </div>
        </section>

        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#eaf7f5] text-[#258b82]">
              <MapPin className="size-4" />
            </span>
            <span>
              <h2 className="text-xs font-black">Где это увидят</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Выбери городскую сцену или открой план всем
              </p>
            </span>
          </div>
          <label className="mt-4 block" htmlFor="event-scope">
            <span className="text-[10px] font-black text-[#65596e]">Видимость</span>
            <select
              className="mt-1.5 w-full appearance-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-bold outline-none focus:border-[#b28be8]"
              defaultValue={hasCity ? "local" : "open"}
              id="event-scope"
              name="scope"
            >
              <option disabled={!hasCity} value="local">
                В моём городе{profile?.city ? ` · ${profile.city}` : ""}
              </option>
              <option value="open">Открыто для всей платформы</option>
            </select>
          </label>
          {hasCity && (
            <label className="mt-4 block" htmlFor="event-place">
              <span className="flex items-center justify-between text-[10px] font-black text-[#65596e]">
                Место в городе
                <span className="font-semibold text-[#97899e]">необязательно</span>
              </span>
              <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-[#756a7d]">
                {places.length > 0 ? (
                  <PlaceIcon
                    className="size-4 shrink-0 text-[#8753e6]"
                    code={places[0]?.icon_code}
                  />
                ) : (
                  <MapPin className="size-4 shrink-0 text-[#8753e6]" />
                )}
                <select
                  className="min-w-0 grow appearance-none bg-transparent py-3 text-xs font-bold outline-none"
                  defaultValue=""
                  id="event-place"
                  name="place_id"
                >
                  <option value="">Без привязки к месту</option>
                  {places.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name}
                    </option>
                  ))}
                </select>
              </span>
              <span className="mt-1.5 block text-[9px] leading-4 text-[#8a7d91]">
                Доступно только для городского события. Место — это контекст, а не
                точный адрес.
              </span>
            </label>
          )}
        </section>

        <section className="flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
          <p className="text-[10px] leading-4">
            Создавая событие, ты открываешь только его название, описание, время и
            добровольный список участников. Личные сообщения не попадут в городскую
            сцену.
          </p>
        </section>

        <PendingButton pendingLabel="Публикуем…">
          <CheckCircle2 className="size-4.5" /> Опубликовать событие
        </PendingButton>
      </form>
    </main>
  );
}
