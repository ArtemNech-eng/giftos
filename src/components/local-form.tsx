"use client";

import { useActionState } from "react";
import { AlertCircle, MapPin } from "lucide-react";

import { updateLocalCreatorProfile, type LocalActionState } from "@/app/local/actions";
import {
  LOCAL_ROLE_CODES,
  LOCAL_ROLE_LABELS,
  LocalRoleIcon,
} from "@/components/local-role-icon";
import { PendingButton } from "@/components/pending-button";

/** Local-showcase form with inline errors (useActionState). */
export function LocalForm({
  canList,
  initial,
}: {
  canList: boolean;
  initial: {
    is_listed: boolean;
    role_code: string | null;
    city_label: string | null;
    headline: string | null;
  };
}) {
  const [state, formAction] = useActionState<LocalActionState, FormData>(
    updateLocalCreatorProfile,
    null,
  );

  return (
    <form
      action={formAction}
      className="mt-5 space-y-5 rounded-[1.8rem] border border-[#2c2036]/10 bg-white p-5 shadow-[0_10px_28px_rgba(69,43,94,.06)]"
    >
      {state?.error && (
        <div
          className="flex items-start gap-2 rounded-2xl border border-[#f0c8c8] bg-[#fff5f5] p-3.5 text-[#c0392b]"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="text-[11px] font-bold leading-4">{state.error}</p>
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f7f2fa] p-3.5">
        <input
          className="mt-0.5 accent-[#8753e6]"
          defaultChecked={initial.is_listed}
          disabled={!canList}
          name="is_listed"
          type="checkbox"
        />
        <span>
          <b className="block text-sm">Показывать меня в «Создают в городе»</b>
          <span className="mt-1 block text-[10px] leading-5 text-[#81748a]">
            Только публичный профиль с отображением города. Никакой записи или оплаты
            услуг здесь не создаётся.
          </span>
        </span>
      </label>

      <div>
        <p className="text-sm font-black">Чем ты занимаешься?</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {LOCAL_ROLE_CODES.map((role) => (
            <label className="cursor-pointer" key={role}>
              <input
                className="peer sr-only"
                defaultChecked={(initial.role_code ?? "other") === role}
                name="role_code"
                type="radio"
                value={role}
              />
              <span className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-[#2c2036]/10 bg-white px-1 text-center text-[#756a7d] transition peer-checked:border-[#ad7bf4] peer-checked:bg-[#f2eaff] peer-checked:text-[#7549d0]">
                <LocalRoleIcon className="size-5" code={role} />
                <span className="mt-1 text-[9px] font-bold leading-3">
                  {LOCAL_ROLE_LABELS[role]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-black">Как тебя знают в городе?</span>
        <span className="ml-1 text-[10px] text-[#8a7d92]">необязательно</span>
        <input
          className="mt-2 h-12 w-full rounded-2xl border border-[#2c2036]/10 bg-[#faf7fc] px-3.5 text-sm outline-none placeholder:text-[#a69bab] focus:border-[#9a62eb] focus:ring-4 focus:ring-[#9a62eb]/10"
          defaultValue={initial.city_label ?? ""}
          maxLength={40}
          name="city_label"
          placeholder="Например: мастер маникюра у ДК"
        />
        <span className="mt-1.5 block text-[10px] leading-5 text-[#8a7d92]">
          Это самоописание, не подтверждённая профессиональная или государственная
          должность.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-black">Что сейчас показываешь?</span>
        <textarea
          className="mt-2 min-h-20 w-full rounded-2xl border border-[#2c2036]/10 bg-[#faf7fc] p-3.5 text-sm outline-none placeholder:text-[#a69bab] focus:border-[#9a62eb] focus:ring-4 focus:ring-[#9a62eb]/10"
          defaultValue={initial.headline ?? ""}
          maxLength={120}
          name="headline"
          placeholder="Например: показываю новые работы, веду эфиры и собираю девушек на бьюти-встречи"
        />
      </label>

      {!canList && (
        <p className="flex items-start gap-2 rounded-xl bg-[#fff3d8] p-3 text-[11px] leading-5 text-[#85651f]">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          Для витрины укажите город, сделайте профиль публичным и включите отображение
          города в настройках.
        </p>
      )}

      {canList ? (
        <PendingButton pendingLabel="Сохраняем…">
          <MapPin className="size-4" /> Сохранить локальную витрину
        </PendingButton>
      ) : (
        <button
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white opacity-50 shadow-[0_9px_20px_rgba(160,75,213,.24)]"
          disabled
          type="button"
        >
          <MapPin className="size-4" /> Сохранить локальную витрину
        </button>
      )}
    </form>
  );
}
