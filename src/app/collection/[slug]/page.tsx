import Link from "next/link";
/* eslint-disable @next/next/no-img-element -- generated static pre-production artifact art */
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Gem,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Артефакт",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type ArtifactSeries = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  artwork_path: string;
  rarity: "limited" | "rare" | "iconic";
  total_edition: number;
  remaining_edition: number;
  price_stars: number;
};
type ArtifactInstance = {
  id: string;
  serial_number: number;
  display_on_profile: boolean;
  unboxed_at: string | null;
};

const rarityCopy = {
  limited: "Лимитированный предмет",
  rare: "Редкий предмет",
  iconic: "Иконический предмет",
} as const;

export default async function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, user } = await requireUser();
  const { data: rawArtifact } = await supabase
    .from("collectible_artifact_series")
    .select(
      "id, slug, title, description, artwork_path, rarity, total_edition, remaining_edition, price_stars",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  const artifact = rawArtifact as ArtifactSeries | null;
  if (!artifact) notFound();

  const { data: rawOwned } = await supabase
    .from("collectible_artifact_instances")
    .select("id, serial_number, display_on_profile, unboxed_at")
    .eq("series_id", artifact.id)
    .eq("recipient_id", user.id)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const owned = rawOwned as ArtifactInstance | null;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к коллекции"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/collection"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            ARTIFACTS 01
          </small>
          <h1 className="mt-0.5 text-sm font-black">Предмет</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Gem className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] border border-white/80 bg-gradient-to-br from-[#fffaff] via-[#f4effd] to-[#eaf5ff] p-3 shadow-[0_14px_32px_rgba(69,43,94,.1)]">
        <img
          loading="lazy"
          decoding="async"
          alt={artifact.title}
          className="aspect-square w-full rounded-[1.45rem] object-cover"
          src={artifact.artwork_path}
        />
      </section>

      <section className="border-[#2c2036]/9 mt-5 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <span className="inline-flex rounded-full bg-[#f0e9ff] px-2 py-1 text-[9px] font-black text-[#7549d0]">
          {rarityCopy[artifact.rarity]}
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.065em]">
          {artifact.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#5f5369]">
          {artifact.description ??
            "Лимитированный предмет из первой десятки ARTIFACTS 01."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <span className="rounded-xl bg-[#fbf9fe] p-3">
            <small className="block text-[9px] font-black uppercase tracking-[0.1em] text-[#93869d]">
              Тираж
            </small>
            <b className="mt-1 block text-sm">
              {artifact.remaining_edition} / {artifact.total_edition}
            </b>
          </span>
          <span className="rounded-xl bg-[#fbf9fe] p-3">
            <small className="block text-[9px] font-black uppercase tracking-[0.1em] text-[#93869d]">
              Подарок
            </small>
            <b className="mt-1 block text-sm text-[#7549d0]">
              {artifact.price_stars} ⭐
            </b>
          </span>
        </div>
      </section>

      {owned?.unboxed_at ? (
        <section className="mt-4 flex gap-3 rounded-[1.5rem] border border-[#c5e7dc] bg-[#f0faf5] p-4 text-[#4c7169]">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#258b82]">
            <Check className="size-4" />
          </span>
          <span>
            <b className="block text-xs">Этот предмет уже на твоей полке</b>
            <span className="mt-1 block text-[10px] leading-4">
              #{owned.serial_number} / {artifact.total_edition}
              {owned.display_on_profile
                ? " · показывается в профиле"
                : " · скрыт в коллекции"}
            </span>
          </span>
        </section>
      ) : (
        <Link
          className="mt-4 flex items-center gap-3 rounded-[1.5rem] bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] p-4 text-white shadow-[0_10px_22px_rgba(160,75,213,.22)]"
          href="/people"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-white/15">
            <UsersRound className="size-5" />
          </span>
          <span className="grow">
            <b className="block text-xs">Выбрать, кому подарить</b>
            <small className="mt-1 block text-[10px] text-white/75">
              Артефакт выбирается на публичном профиле человека.
            </small>
          </span>
          <ChevronRight className="size-4" />
        </Link>
      )}

      <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Это коллекционный предмет, не финансовый актив: его нельзя перепродать,
          обменять или вывести в деньги. Он не даёт статов и не влияет на рейтинг.
        </p>
      </section>
    </main>
  );
}
