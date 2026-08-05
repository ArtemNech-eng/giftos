import { createReport } from "@/app/safety/actions";

export function ReportForm({
  targetType,
  targetId,
  returnTo,
}: {
  targetType:
    | "profile"
    | "wish"
    | "fundraiser"
    | "comment"
    | "message"
    | "story"
    | "wish_comment"
    | "live_room";
  targetId: string;
  returnTo: string;
}) {
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-sm font-semibold text-[#8e747c] transition hover:bg-rose-50 hover:text-[#bd3e66]">
        ⋯
      </summary>
      <form
        action={createReport}
        className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-[#ead9df] bg-white p-3 shadow-glow"
      >
        <input name="target_type" type="hidden" value={targetType} />
        <input name="target_id" type="hidden" value={targetId} />
        <input name="return_to" type="hidden" value={returnTo} />
        <p className="text-sm font-bold">Пожаловаться</p>
        <select
          className="mt-2 h-9 w-full rounded-lg border border-[#e7d8dc] bg-white px-2 text-sm"
          defaultValue=""
          name="reason"
          required
        >
          <option disabled value="">
            Выберите причину
          </option>
          <option value="fraud">Мошенничество</option>
          <option value="prohibited_content">Запрещённый контент</option>
          <option value="false_information">Ложная информация</option>
          <option value="spam">Спам</option>
          <option value="inappropriate_content">Неприемлемый контент</option>
          <option value="other">Другое</option>
        </select>
        <textarea
          className="mt-2 min-h-16 w-full rounded-lg border border-[#e7d8dc] px-2 py-1.5 text-sm"
          maxLength={2000}
          name="details"
          placeholder="Опишите ситуацию (необязательно)"
        />
        <button
          className="mt-2 h-9 w-full rounded-lg bg-[#df4f7d] text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
          type="submit"
        >
          Отправить
        </button>
      </form>
    </details>
  );
}
