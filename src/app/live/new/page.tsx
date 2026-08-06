import Link from "next/link";
import { ArrowLeft, ChevronRight, ShieldCheck, Video } from "lucide-react";

import { createLiveRoom } from "@/app/live/actions";
import { CATEGORIES } from "@/lib/constants";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Создать эфир",
  robots: { index: false, follow: false },
};

export default async function NewLivePage() {
  const { supabase, user } = await requireUser();
  const { data: wishes } = await supabase
    .from("wishes")
    .select("id, title")
    .eq("author_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#241a2c]">
      <header className="flex items-center justify-between">
        <Link
          className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white shadow-[0_6px_18px_rgba(64,38,88,0.08)]"
          href="/creator/dashboard"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-black tracking-[-0.03em]">Создание эфира</h1>
        <span className="w-10" />
      </header>

      <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#dcc0ff]/70 bg-white p-5 shadow-[0_18px_48px_rgba(84,49,112,0.1)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b5fbd]">
              Live room
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.065em]">
              Выйди в эфир
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[#73677c]">
              Комната, ссылка и чат — всё, чтобы собрать своих без лишних настроек.
            </p>
          </div>
          <span className="grid size-14 place-items-center rounded-[1.35rem] bg-gradient-to-br from-[#ff75ab] to-[#8758ef] text-white shadow-[0_12px_26px_rgba(174,74,201,0.27)]">
            <Video className="size-7" />
          </span>
        </div>
      </section>

      <form
        action={createLiveRoom}
        className="mt-5 space-y-4 rounded-[1.8rem] border border-[#2c2036]/10 bg-white p-5 shadow-[0_12px_30px_rgba(69,43,94,0.07)]"
      >
        <label className="block">
          <span className="text-sm font-black">Название эфира</span>
          <span className="ml-1 text-xs text-[#93879c]">необязательно</span>
          <input
            className="mt-2 h-12 w-full rounded-2xl border border-[#2c2036]/10 bg-[#faf7fc] px-4 text-sm outline-none transition placeholder:text-[#a89eae] focus:border-[#9a62eb] focus:ring-4 focus:ring-[#9a62eb]/10"
            maxLength={160}
            name="title"
            placeholder="Например: Болтаем и играем 💜"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-black">О чём поговорим?</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-[#2c2036]/10 bg-[#faf7fc] p-4 text-sm outline-none transition placeholder:text-[#a89eae] focus:border-[#9a62eb] focus:ring-4 focus:ring-[#9a62eb]/10"
            maxLength={1000}
            name="description"
            placeholder="Коротко расскажи зрителям, что их ждёт"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-black">Категория</span>
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-[#2c2036]/10 bg-[#faf7fc] px-3 text-sm outline-none focus:border-[#9a62eb]"
              defaultValue=""
              name="category_slug"
            >
              <option value="">Выбрать</option>
              {CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.emoji} {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-black">Желание</span>
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-[#2c2036]/10 bg-[#faf7fc] px-3 text-sm outline-none focus:border-[#9a62eb]"
              defaultValue=""
              name="wish_id"
            >
              <option value="">Не выбирать</option>
              {(wishes ?? []).map((wish) => (
                <option key={wish.id} value={wish.id}>
                  {wish.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-2xl bg-[#f3edfa] p-3.5 text-xs leading-5 text-[#6e6178]">
          <span className="flex items-center gap-1.5 font-bold text-[#6740b2]">
            <ShieldCheck className="size-4" /> Комната создаётся в тестовом media-режиме
          </span>
          <span className="mt-1 block">
            Видео и звук подключатся автоматически после настройки LiveKit/SFU.
          </span>
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff4d8d] to-[#8753ed] py-3.5 text-sm font-black text-white shadow-[0_12px_26px_rgba(174,74,201,0.26)] transition hover:-translate-y-0.5"
          type="submit"
        >
          Начать эфир <ChevronRight className="size-4" />
        </button>
      </form>
    </main>
  );
}
