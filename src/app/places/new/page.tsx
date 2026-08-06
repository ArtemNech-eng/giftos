import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { createPlace } from "@/app/places/actions";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать место",
  robots: { index: false, follow: false },
};

const EMOJI_OPTIONS = ["🏠", "🌙", "🔥", "🎮", "🎵", "🏋️", "❤️", "🎤", "☕", "🚀"];

export default async function NewPlacePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/places"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Создать место</h1>
        <span className="w-9" />
      </header>

      <form action={createPlace} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-[#d8d0e0]" htmlFor="place-name">
            Название
          </label>
          <input
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            id="place-name"
            maxLength={60}
            name="name"
            placeholder="Наша тусовка"
            required
          />
        </div>
        <div>
          <label
            className="text-sm font-semibold text-[#d8d0e0]"
            htmlFor="place-description"
          >
            Описание
          </label>
          <textarea
            className="mt-1.5 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            id="place-description"
            maxLength={500}
            name="description"
            placeholder="О чём это место?"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-[#d8d0e0]">Эмодзи</label>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {EMOJI_OPTIONS.map((emoji, index) => (
              <label className="cursor-pointer" key={emoji}>
                <input
                  className="peer sr-only"
                  defaultChecked={index === 0}
                  name="emoji"
                  type="radio"
                  value={emoji}
                />
                <span className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-2xl transition peer-checked:border-[#ff77ba] peer-checked:bg-[#3a1a35]">
                  {emoji}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-[#d8d0e0]" htmlFor="place-kind">
            Тип
          </label>
          <select
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            defaultValue="personal"
            id="place-kind"
            name="kind"
          >
            <option value="personal">🏠 Постоянная тусовка</option>
            <option value="temporary">🔥 Временная (на сегодня)</option>
          </select>
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] py-3 text-sm font-bold"
          type="submit"
        >
          <MapPin className="size-4" /> Создать место
        </button>
        {!profile?.city && (
          <p className="text-center text-xs text-[#ff9bc5]">
            Сначала укажите город в профиле.
          </p>
        )}
      </form>
    </main>
  );
}
