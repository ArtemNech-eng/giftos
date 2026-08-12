import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, UsersRound } from "lucide-react";

import { EventCreateForm } from "@/components/event-create-form";
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

      <EventCreateForm
        city={profile?.city ?? null}
        hasCity={hasCity}
        minDate={minDate}
        places={places}
      />
    </main>
  );
}
