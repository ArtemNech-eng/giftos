import Link from "next/link";
import { ArrowLeft, MapPin, Sparkles, UsersRound } from "lucide-react";

import { PlaceCreateForm } from "@/components/place-create-form";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать место",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

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
        <PlaceCreateForm />
      )}
    </main>
  );
}
