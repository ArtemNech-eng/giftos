import Link from "next/link";
import { ArrowLeft, Eye, Film, MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { createStory } from "@/app/stories/actions";
import { StoryVideoPicker } from "@/components/story-video-picker";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Новая story",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function NewStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, city, show_city, profile_visibility, is_creator")
    .eq("id", user.id)
    .maybeSingle();
  const cityContext = Boolean(
    profile?.city && profile.show_city && profile.profile_visibility === "public",
  );

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться в профиль"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href={profile?.username ? `/u/${profile.username}` : "/feed"}
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Ежедневный пульс
          </small>
          <h1 className="mt-0.5 text-sm font-black">Новая story</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Film className="size-4.5" />
        </span>
      </header>

      {created === "1" && (
        <section className="mt-4 flex items-center gap-2 rounded-2xl border border-[#bde6d4] bg-[#effaf4] p-3.5 text-[#258b82]">
          <ShieldCheck className="size-4 shrink-0" />
          <p className="text-[10px] font-black">Story опубликована.</p>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Sparkles className="size-3.5" /> Покажи момент
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          Не нужен эфир,
          <br />
          чтобы быть в городе.
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-white/75">
          Одна короткая story может продолжить твою историю и дать людям повод зайти к
          тебе.
        </p>
      </section>

      {!profile?.is_creator ? (
        <section className="mt-5 rounded-[1.6rem] border border-[#d9c5f3] bg-[#fffaff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <Film className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            Сначала открой страницу автора
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            Stories доступны авторам, которые готовы показывать свой сюжет людям.
          </p>
          <Link
            className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2.5 text-xs font-black text-white"
            href="/creator/start"
          >
            Создать страницу автора
          </Link>
        </section>
      ) : (
        <form action={createStory} className="mt-5 space-y-4">
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
              className={`mt-3 rounded-xl p-3 text-[10px] leading-4 ${cityContext ? "bg-[#f0faf5] text-[#4c7169]" : "bg-[#fff7e8] text-[#896a27]"}`}
            >
              {cityContext
                ? `Публичная story сразу появляется в контексте ${profile?.city}.`
                : "Story останется в профиле автора. Чтобы участвовать в городской сцене, включи публичный профиль и город в настройках."}
            </p>
          </section>

          <section className="flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
            <Eye className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
            <p className="text-[10px] leading-4">
              Новые stories публикуются бесплатными. Paid unlock и creator payout
              отложены до production-подготовки.
            </p>
          </section>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)]"
            type="submit"
          >
            <Film className="size-4.5" /> Опубликовать story
          </button>
        </form>
      )}
    </main>
  );
}
