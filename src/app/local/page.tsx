import Link from "next/link";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";

import { updateLocalCreatorProfile } from "@/app/local/actions";
import {
  LOCAL_ROLE_CODES,
  LOCAL_ROLE_LABELS,
  LocalRoleIcon,
} from "@/components/local-role-icon";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Локальная витрина",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function LocalCreatorPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: local }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, city, city_id, profile_visibility, show_city")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("local_creator_profiles")
      .select("is_listed, role_code, city_label, headline")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const canList = Boolean(
    profile?.city_id && profile.profile_visibility === "public" && profile.show_city,
  );

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white shadow-[0_6px_18px_rgba(64,38,88,.08)]"
          href="/settings"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-black tracking-[-0.03em]">Локальная витрина</h1>
        <span className="w-10" />
      </header>

      <section className="mt-6 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#f3e8ff] via-[#fff6fb] to-[#e7f4ff] p-5 shadow-[0_14px_34px_rgba(95,57,130,.12)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#8753e6]">
              Создают в городе
            </p>
            <h2 className="mt-2 text-2xl font-black leading-[0.95] tracking-[-0.065em]">
              Стань заметным
              <br />
              среди своих.
            </h2>
          </div>
          <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#8753e6] shadow-[0_6px_16px_rgba(100,54,140,.1)]">
            <Sparkles className="size-6" />
          </span>
        </div>
        <p className="mt-4 max-w-sm text-[12px] leading-5 text-[#6e6178]">
          Не реклама на всю страну. Покажи, что ты создаёшь в{" "}
          {profile?.city ?? "своём городе"}, через stories, эфиры, места и события.
        </p>
      </section>

      <form
        action={updateLocalCreatorProfile}
        className="mt-5 space-y-5 rounded-[1.8rem] border border-[#2c2036]/10 bg-white p-5 shadow-[0_10px_28px_rgba(69,43,94,.06)]"
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f7f2fa] p-3.5">
          <input
            className="mt-0.5 accent-[#8753e6]"
            defaultChecked={local?.is_listed ?? false}
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
                  defaultChecked={(local?.role_code ?? "other") === role}
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
            defaultValue={local?.city_label ?? ""}
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
            defaultValue={local?.headline ?? ""}
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

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_9px_20px_rgba(160,75,213,.24)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canList}
          type="submit"
        >
          <MapPin className="size-4" /> Сохранить локальную витрину
        </button>
      </form>
    </main>
  );
}
