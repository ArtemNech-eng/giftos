"use client";

import { useActionState } from "react";
import { AlertCircle, Eye, Film, MapPin, Store } from "lucide-react";

import { createStory, type StoryActionState } from "@/app/stories/actions";
import { PendingButton } from "@/components/pending-button";
import { StoryVideoPicker } from "@/components/story-video-picker";

type MyService = {
  id: string;
  title: string;
  kind: "service" | "business";
};

/**
 * Create-story form with inline errors: a failed upload or validation
 * renders inside the form (the picked video stays selected).
 */
export function StoryCreateForm({
  myServices,
  cityContext,
  city,
}: {
  myServices: MyService[];
  cityContext: boolean;
  city: string | null;
}) {
  const [state, formAction] = useActionState<StoryActionState, FormData>(
    createStory,
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
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
            <Film className="size-4" />
          </span>
          <span>
            <h2 className="text-xs font-black">Видео</h2>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              Сними момент сейчас или выбери готовый клип
            </p>
          </span>
        </div>
        <StoryVideoPicker />
      </section>

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <label className="block" htmlFor="story-caption">
          <span className="text-xs font-black">Подпись</span>
          <span className="ml-1 text-[10px] text-[#8a7d91]">необязательно</span>
          <textarea
            className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
            id="story-caption"
            maxLength={500}
            name="caption"
            placeholder="Что происходит в этом моменте?"
          />
        </label>
      </section>

      {myServices.length > 0 && (
        <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#fff6e8] text-[#a87511]">
              <Store className="size-4" />
            </span>
            <span>
              <h2 className="text-xs font-black">Портфолио для витрины</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                Покажи работу — зритель перейдёт к твоему объявлению
              </p>
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-2.5">
              <input
                className="accent-[#7549d0]"
                defaultChecked
                name="linked_service_id"
                type="radio"
                value=""
              />
              <span className="text-[10px] font-bold text-[#756a7d]">
                Без объявления — просто story
              </span>
            </label>
            {myServices.map((service) => (
              <label
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-2.5"
                key={service.id}
              >
                <input
                  className="accent-[#7549d0]"
                  name="linked_service_id"
                  type="radio"
                  value={service.id}
                />
                <span className="min-w-0 grow">
                  <span className="block truncate text-[11px] font-bold text-[#5f5369]">
                    {service.title}
                  </span>
                  <small className="text-[9px] font-bold text-[#a093a6]">
                    {service.kind === "business" ? "Заведение" : "Услуга"}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="border-[#2c2036]/9 rounded-[1.6rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#eaf7f5] text-[#258b82]">
            <MapPin className="size-4" />
          </span>
          <span>
            <h2 className="text-xs font-black">Городской контекст</h2>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              Story не раскрывает твою точную геолокацию
            </p>
          </span>
        </div>
        <p
          className={`mt-3 rounded-xl p-3 text-[10px] leading-4 ${
            cityContext ? "bg-[#f0faf5] text-[#4c7169]" : "bg-[#fff7e8] text-[#896a27]"
          }`}
        >
          {cityContext
            ? `Публичная story сразу появляется в контексте ${city}.`
            : "Story останется в профиле автора. Чтобы участвовать в городской сцене, включи публичный профиль и город в настройках."}
        </p>
      </section>

      <section className="flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <Eye className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Новые stories публикуются бесплатными. Paid unlock и creator payout отложены
          до production-подготовки.
        </p>
      </section>

      <PendingButton pendingLabel="Публикуем…">
        <Film className="size-4.5" /> Опубликовать story
      </PendingButton>
    </form>
  );
}
