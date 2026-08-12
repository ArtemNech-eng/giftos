import Link from "next/link";
import { ArrowLeft, Film, ShieldCheck, Sparkles } from "lucide-react";

import { StoryCreateForm } from "@/components/story-create-form";
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

  // Portfolio link: author's own active listings.
  const { data: rawMyServices } = profile?.is_creator
    ? await supabase
        .from("city_services")
        .select("id, title, kind")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(10)
    : { data: [] };
  const myServices = (rawMyServices ?? []) as Array<{
    id: string;
    title: string;
    kind: "service" | "business";
  }>;

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
        <StoryCreateForm
          city={profile?.city ?? null}
          cityContext={cityContext}
          myServices={myServices}
        />
      )}
    </main>
  );
}
