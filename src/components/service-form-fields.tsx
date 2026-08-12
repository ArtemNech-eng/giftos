"use client";

import { useState } from "react";
import { Briefcase, Clock3, MapPin, Plus, Store, Trash2 } from "lucide-react";

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export type ServiceFormItem = { title: string; price: string };
export type ServiceFormHours = {
  day: number;
  open?: string;
  close?: string;
  closed?: boolean;
};

function parseHours(raw: string | null | undefined): ServiceFormHours[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ServiceFormHours[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Kind-dependent listing fields (WhatsApp Business as a reference):
 * venues get address + weekly hours; everyone gets a price catalog.
 * Works inside a server-action form: repeated inputs are read with
 * FormData.getAll.
 */
export function ServiceFormFields({
  initialKind,
  address,
  hours,
  items,
}: {
  initialKind: "service" | "business";
  address?: string | null;
  hours?: string | null;
  items?: ServiceFormItem[];
}) {
  const [kind, setKind] = useState<"service" | "business">(initialKind);
  const [catalog, setCatalog] = useState<ServiceFormItem[]>(
    items && items.length > 0 ? items : [{ title: "", price: "" }],
  );
  const [schedule, setSchedule] = useState<ServiceFormHours[]>(() => {
    const parsed = parseHours(hours);
    if (parsed.length === 7) return parsed;
    return DAY_LABELS.map((_, day) => ({
      day,
      open: day < 5 ? "09:00" : "10:00",
      close: day < 5 ? "18:00" : "15:00",
    }));
  });

  function setDay(day: number, patch: Partial<ServiceFormHours>) {
    setSchedule((prev) =>
      prev.map((item) => (item.day === day ? { ...item, ...patch } : item)),
    );
  }

  function updateItem(index: number, patch: Partial<ServiceFormItem>) {
    setCatalog((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  return (
    <>
      <section className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <b className="block text-[11px]">Что это?</b>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-[10px] font-black ${
              kind === "service"
                ? "border-[#a67ae7] bg-[#f0e9ff] text-[#7549d0]"
                : "border-[#2c2036]/10 bg-[#fbf9fe] text-[#756a7d]"
            }`}
          >
            <input
              checked={kind === "service"}
              className="accent-[#7549d0]"
              name="kind"
              onChange={() => setKind("service")}
              type="radio"
              value="service"
            />
            <Briefcase className="size-4" /> Услуга
          </label>
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-[10px] font-black ${
              kind === "business"
                ? "border-[#a67ae7] bg-[#f0e9ff] text-[#7549d0]"
                : "border-[#2c2036]/10 bg-[#fbf9fe] text-[#756a7d]"
            }`}
          >
            <input
              checked={kind === "business"}
              className="accent-[#7549d0]"
              name="kind"
              onChange={() => setKind("business")}
              type="radio"
              value="business"
            />
            <Store className="size-4" /> Заведение
          </label>
        </div>
      </section>

      {kind === "business" && (
        <>
          <section className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <b className="flex items-center gap-1.5 text-[11px]">
              <MapPin className="size-3.5 text-[#8753e6]" /> Адрес
            </b>
            <input
              className="mt-2 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-xs font-semibold outline-none placeholder:text-[#aaa0ae]"
              defaultValue={address ?? ""}
              maxLength={200}
              name="address"
              placeholder="ул. Ленина, 12 — как найти"
            />
          </section>

          <section className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <b className="flex items-center gap-1.5 text-[11px]">
              <Clock3 className="size-3.5 text-[#8753e6]" /> График работы
            </b>
            <p className="mt-1 text-[10px] leading-4 text-[#81748a]">
              Клиенты увидят часы на карточке — как в WhatsApp Business.
            </p>
            <div className="mt-3 space-y-1.5">
              {DAY_LABELS.map((label, day) => {
                const item = schedule.find((entry) => entry.day === day);
                const closed = Boolean(item?.closed);
                return (
                  <div
                    className="flex items-center gap-2 rounded-xl bg-[#fbf9fe] px-3 py-2"
                    key={label}
                  >
                    <span className="w-8 shrink-0 text-[10px] font-black text-[#5f5369]">
                      {label}
                    </span>
                    {closed ? (
                      <span className="text-[10px] font-bold text-[#a093a6]">
                        Выходной
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <input
                          aria-label={`${label} открытие`}
                          className="rounded-lg border border-[#2c2036]/10 bg-white px-2 py-1.5 text-[10px] font-semibold text-[#5f5369] outline-none"
                          defaultValue={item?.open ?? "09:00"}
                          name={`hours_open_${day}`}
                          type="time"
                        />
                        <span className="text-[10px] text-[#a093a6]">—</span>
                        <input
                          aria-label={`${label} закрытие`}
                          className="rounded-lg border border-[#2c2036]/10 bg-white px-2 py-1.5 text-[10px] font-semibold text-[#5f5369] outline-none"
                          defaultValue={item?.close ?? "18:00"}
                          name={`hours_close_${day}`}
                          type="time"
                        />
                      </span>
                    )}
                    <label className="ml-auto flex shrink-0 cursor-pointer items-center gap-1.5 text-[9px] font-bold text-[#756a7d]">
                      <input
                        checked={closed}
                        className="accent-[#7549d0]"
                        name={`hours_closed_${day}`}
                        onChange={(event) =>
                          setDay(day, { closed: event.target.checked })
                        }
                        type="checkbox"
                      />
                      Закрыто
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <section className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center justify-between">
          <b className="text-[11px]">
            {kind === "business" ? "Меню и цены" : "Услуги и цены"}
          </b>
          <button
            className="inline-flex items-center gap-1 rounded-lg bg-[#f0e9ff] px-2.5 py-1.5 text-[10px] font-black text-[#7549d0]"
            onClick={() => setCatalog((prev) => [...prev, { title: "", price: "" }])}
            type="button"
          >
            <Plus className="size-3" /> Добавить
          </button>
        </div>
        <div className="mt-2.5 space-y-2">
          {catalog.map((item, index) => (
            <div className="flex items-center gap-2" key={index}>
              <input
                aria-label="Название"
                className="min-w-0 grow rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-2.5 text-[11px] font-semibold outline-none placeholder:text-[#aaa0ae]"
                maxLength={120}
                name="item_title"
                onChange={(event) => updateItem(index, { title: event.target.value })}
                placeholder="Маникюр + гель-лак"
                value={item.title}
              />
              <input
                aria-label="Цена"
                className="w-20 shrink-0 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-2 py-2.5 text-[11px] font-semibold outline-none placeholder:text-[#aaa0ae]"
                maxLength={40}
                name="item_price"
                onChange={(event) => updateItem(index, { price: event.target.value })}
                placeholder="1 200 ₽"
                value={item.price}
              />
              {catalog.length > 1 && (
                <button
                  aria-label="Удалить"
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[#c0392b]"
                  onClick={() =>
                    setCatalog((prev) => prev.filter((_, i) => i !== index))
                  }
                  type="button"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <small className="mt-2 block text-[9px] leading-4 text-[#a093a6]">
          До 8 позиций. Цены — как напишешь: «1 200 ₽», «от 500 ₽», «по записи».
        </small>
      </section>
    </>
  );
}
