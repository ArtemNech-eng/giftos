"use client";

import { useActionState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { createEvent, type EventActionState } from "@/app/events/actions";
import { PendingButton } from "@/components/pending-button";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/components/event-type-icon";
import { PlaceIcon } from "@/components/place-icon";

type PlaceOption = { id: string; name: string; icon_code: string | null };

/**
 * Create-event form with inline errors (useActionState): validation
 * failures render inside the form, nothing is lost.
 */
export function EventCreateForm({
  places,
  hasCity,
  city,
  minDate,
}: {
  places: PlaceOption[];
  hasCity: boolean;
  city: string | null;
  minDate: string;
}) {
  const [state, formAction] = useActionState<EventActionState, FormData>(
    createEvent,
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
              В моём городе{city ? ` · ${city}` : ""}
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
              Доступно только для городского события. Место — это контекст, а не точный
              адрес.
            </span>
          </label>
        )}
      </section>

      <section className="flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Создавая событие, ты открываешь только его название, описание, время и
          добровольный список участников. Личные сообщения не попадут в городскую сцену.
        </p>
      </section>

      <PendingButton pendingLabel="Публикуем…">
        <CheckCircle2 className="size-4.5" /> Опубликовать событие
      </PendingButton>
    </form>
  );
}
