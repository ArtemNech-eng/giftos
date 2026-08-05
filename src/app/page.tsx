import Link from "next/link";
import { ArrowRight, CirclePlay, Gift, Sparkles, UsersRound } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Хочу также — общайся, создавай, зарабатывай",
  description:
    "Платформа авторских страниц, video stories, общения, поддержки и creator-аудитории.",
};

export const dynamic = "force-dynamic";

type CreatorPreview = {
  username: string;
  display_name: string;
  creator_headline: string | null;
};

export default async function SeoLandingPage() {
  let creators: CreatorPreview[] = [];
  if (hasSupabaseEnvironment()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, creator_headline")
        .eq("is_creator", true)
        .eq("profile_visibility", "public")
        .eq("is_suspended", false)
        .order("created_at", { ascending: false })
        .limit(6);
      creators = (data ?? []) as CreatorPreview[];
    } catch {
      creators = [];
    }
  }

  return (
    <main className="min-h-screen bg-[#0c0e14] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link className="flex items-center gap-2 text-xl font-bold" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff4b8a] to-[#7d45ff] text-lg">
            ♡
          </span>
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            className="hidden text-sm font-semibold text-[#c8c1d2] hover:text-white sm:block"
            href="/feed"
          >
            Лента
          </Link>
          <Link
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#21132e]"
            href="/auth/sign-in"
          >
            Войти
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#d45dff]/30 bg-[#281633] px-3 py-1.5 text-sm font-semibold text-[#e6b6ff]">
            <Sparkles className="size-4" /> Новая creator-платформа
          </p>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-bold leading-tight sm:text-6xl">
            Твоё внимание, контент и аудитория могут стоить денег.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#bcb4c7]">
            Создавай авторскую страницу, публикуй video stories, собирай аудиторию и
            развивай свою историю.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-5 font-bold shadow-[0_10px_30px_rgba(174,64,255,0.35)]"
              href="/creator/start"
            >
              Создать страницу <ArrowRight className="size-4" />
            </Link>
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 font-semibold text-[#e7e0ed]"
              href="/feed"
            >
              <CirclePlay className="size-4" /> Смотреть авторов
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-[#bbb2c5]">
            <span>
              <b className="text-white">Stories</b> автора
            </span>
            <span>
              <b className="text-white">Подписки</b> и поддержка
            </span>
            <span>
              <b className="text-white">Хочу также</b> — начни сам
            </span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-10 rounded-full bg-[#7d45ff]/25 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#151723] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <span className="font-bold">Хочу также</span>
              <span className="rounded-full bg-[#292032] px-2 py-1 text-xs text-[#ffd35e]">
                ● 2 450
              </span>
            </div>
            <p className="mt-5 font-bold">Новые stories</p>
            <div className="mt-3 flex gap-3">
              {["Настя", "Макс", "Лиза"].map((name, index) => (
                <div className="flex flex-col items-center gap-1" key={name}>
                  <span
                    className={`grid size-12 place-items-center rounded-full bg-gradient-to-br p-0.5 ${["from-[#ff4b8a] to-[#7d45ff]", "from-[#ff9356] to-[#f34b9a]", "from-[#8656ff] to-[#d859ff]"][index]}`}
                  >
                    <span className="grid size-full place-items-center rounded-full bg-[#2b1d31] text-sm font-bold">
                      {name[0]}
                    </span>
                  </span>
                  <small className="text-xs text-[#ccc3d5]">{name}</small>
                </div>
              ))}
            </div>
            <p className="mt-6 font-bold">Можно поддержать</p>
            <div className="mt-3 space-y-2">
              {["Настя · Новая story", "Макс · Играю в Valorant"].map((item) => (
                <div
                  className="flex items-center justify-between rounded-xl bg-[#20222e] p-3 text-sm"
                  key={item}
                >
                  <span>{item}</span>
                  <span className="text-[#ef80c0]">Открыть ›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-white/8 border-y bg-[#11131c]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="text-2xl font-bold">Здесь можно не только смотреть</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border-white/8 rounded-2xl border bg-[#191b26] p-5">
              <UsersRound className="size-6 text-[#dc83ff]" />
              <h3 className="mt-4 font-bold">Создавай страницу</h3>
              <p className="mt-2 text-sm leading-6 text-[#afa7ba]">
                Расскажи о себе, интересах и контенте.
              </p>
            </div>
            <div className="border-white/8 rounded-2xl border bg-[#191b26] p-5">
              <CirclePlay className="size-6 text-[#ff76ad]" />
              <h3 className="mt-4 font-bold">Публикуй stories</h3>
              <p className="mt-2 text-sm leading-6 text-[#afa7ba]">
                Короткие video stories для своей аудитории.
              </p>
            </div>
            <div className="border-white/8 rounded-2xl border bg-[#191b26] p-5">
              <Gift className="size-6 text-[#ffd35e]" />
              <h3 className="mt-4 font-bold">Получай поддержку</h3>
              <p className="mt-2 text-sm leading-6 text-[#afa7ba]">
                Подписки, цели и creator-инструменты появляются постепенно.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-[#d27dff]">Открывай авторов</p>
            <h2 className="mt-1 text-2xl font-bold">
              Страницы, на которые стоит подписаться
            </h2>
          </div>
          <Link className="text-sm font-semibold text-[#eaa1d5]" href="/feed">
            Открыть ленту ›
          </Link>
        </div>
        {creators.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <Link
                className="border-white/8 rounded-2xl border bg-[#191b26] p-4 transition hover:border-[#8f48ff]"
                href={`/u/${creator.username}`}
                key={creator.username}
              >
                <p className="font-bold">{creator.display_name}</p>
                <p className="mt-1 text-sm text-[#aea6b9]">
                  {creator.creator_headline ?? "Автор в «Хочу также»"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-6 text-sm text-[#afa7ba]">
            Первые авторы скоро появятся здесь. Ты можешь стать одним из них.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-[#f94c96] to-[#7a45ff] p-8 text-center">
          <h2 className="text-3xl font-bold">Хочешь также?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Создай свою страницу и начни собирать первую аудиторию.
          </p>
          <Link
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-bold text-[#48235e]"
            href="/creator/start"
          >
            Начать
          </Link>
        </div>
      </section>
    </main>
  );
}
