import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Gem,
  Heart,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { setCollectibleArtifactProfileDisplay } from "@/app/collection/actions";
import { requireUser } from "@/lib/auth";
import { AnimatedArtifact } from "@/components/animated-artifact";
import { GIFT_COLLECTIONS } from "@/lib/gift-collections";

export const metadata = {
  title: "Коллекция артефактов",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type ArtifactSeries = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  artwork_path: string;
  collection_slug: string | null;
  rarity: "limited" | "rare" | "iconic";
  total_edition: number;
  remaining_edition: number;
  price_stars: number;
  times_sent: number;
};
type ArtifactInstance = {
  id: string;
  series_id: string;
  serial_number: number;
  issued_at: string;
  unboxed_at: string | null;
  display_on_profile: boolean;
};

const rarityLabel = {
  limited: "Лимитированный",
  rare: "Редкий",
  iconic: "Иконический",
} as const;

const rarityTint: Record<string, string> = {
  limited: "bg-[#f0e9ff] text-[#7549d0]",
  rare: "bg-[#ffe6f0] text-[#d84b81]",
  iconic: "bg-[#fff6d9] text-[#b8860b]",
};

const soldPercent = (total: number, remaining: number) =>
  total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;

function Card({ artifact, owned }: { artifact: ArtifactSeries; owned: number }) {
  return (
    <article className="border-[#2c2036]/9 group relative overflow-hidden rounded-[1.4rem] border bg-white shadow-[0_8px_22px_rgba(69,43,94,.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(69,43,94,.14)]">
      {soldPercent(artifact.total_edition, artifact.remaining_edition) >= 90 &&
        artifact.remaining_edition > 0 && (
          <span className="absolute right-2 top-2 z-40 animate-pulse rounded-full bg-[#ff2d55] px-2 py-0.5 text-[8px] font-black text-white shadow-[0_4px_12px_rgba(255,45,85,.4)]">
            Почти распродано
          </span>
        )}
      <Link className="block" href={`/collection/${artifact.slug}` as Route}>
        <AnimatedArtifact
          alt={artifact.title}
          className="aspect-square w-full transition duration-300 group-hover:scale-[1.04]"
          orbit={artifact.rarity === "iconic"}
          rarity={artifact.rarity}
          src={artifact.artwork_path}
        />
        <div className="p-3">
          <span
            className={`inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-black ${rarityTint[artifact.rarity]}`}
          >
            {rarityLabel[artifact.rarity]}
          </span>
          <h3 className="mt-2 text-xs font-black">{artifact.title}</h3>
          <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#756a7d]">
            {artifact.description}
          </p>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <div className="mt-2">
          <div className="flex items-center justify-between text-[9px] font-black">
            <span className="text-[#8b6a9c]">
              Распродано{" "}
              {soldPercent(artifact.total_edition, artifact.remaining_edition)}%
            </span>
            <span className="text-[#7549d0]">{artifact.price_stars} ⭐</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#f0eaf5]">
            <div
              className={`h-full rounded-full ${
                soldPercent(artifact.total_edition, artifact.remaining_edition) >= 90
                  ? "bg-gradient-to-r from-[#ff2d55] to-[#ff9bc5]"
                  : "bg-gradient-to-r from-[#8254ed] to-[#ff5d9a]"
              }`}
              style={{
                width: `${Math.max(3, soldPercent(artifact.total_edition, artifact.remaining_edition))}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-[8px] font-bold text-[#8b6a9c]">
            Осталось {artifact.remaining_edition} из {artifact.total_edition}
          </p>
        </div>
        {owned > 0 && (
          <p className="mt-2 flex items-center gap-1 text-[8px] font-black text-[#258b82]">
            <Check className="size-3" /> В твоей коллекции: {owned}
          </p>
        )}
      </div>
    </article>
  );
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const { collection: rawCollection = "" } = await searchParams;
  const activeCollection = GIFT_COLLECTIONS.some((item) => item.slug === rawCollection)
    ? rawCollection
    : "all";
  const { supabase, user } = await requireUser();
  const [{ data: wallet }, { data: rawSeries }, { data: rawInstances }] =
    await Promise.all([
      supabase
        .from("bonus_wallets")
        .select("available_balance")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("collectible_artifact_series")
        .select(
          "id, slug, title, description, artwork_path, collection_slug, rarity, total_edition, remaining_edition, price_stars, times_sent",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("collectible_artifact_instances")
        .select(
          "id, series_id, serial_number, issued_at, unboxed_at, display_on_profile",
        )
        .eq("recipient_id", user.id)
        .order("issued_at", { ascending: false }),
    ]);
  const series = (rawSeries ?? []) as ArtifactSeries[];
  const instances = (rawInstances ?? []) as ArtifactInstance[];
  const seriesById = new Map(series.map((item) => [item.id, item]));
  const unboxedInstances = instances.filter((instance) => instance.unboxed_at);
  const ownedBySeries = new Map<string, ArtifactInstance[]>();
  for (const instance of unboxedInstances) {
    const current = ownedBySeries.get(instance.series_id) ?? [];
    current.push(instance);
    ownedBySeries.set(instance.series_id, current);
  }

  const topGifts = [...series]
    .sort((a, b) => (b.times_sent ?? 0) - (a.times_sent ?? 0))
    .slice(0, 5);

  const visibleSeries =
    activeCollection === "all"
      ? series
      : series.filter((item) => item.collection_slug === activeCollection);
  const groups =
    activeCollection === "all"
      ? GIFT_COLLECTIONS.map((collection) => ({
          slug: collection.slug,
          items: series.filter((item) => item.collection_slug === collection.slug),
        })).filter((group) => group.items.length > 0)
      : [
          {
            slug: activeCollection,
            items: visibleSeries,
          },
        ];

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться в профиль"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/feed"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            ХОЧУ · КОЛЛЕКЦИЯ
          </small>
          <h1 className="mt-0.5 text-sm font-black">Коллекция</h1>
        </span>
        <span className="inline-flex h-10 items-center gap-1 rounded-full bg-[#f0e9ff] px-3 text-[10px] font-black text-[#7549d0]">
          <Sparkles className="size-3.5" /> {wallet?.available_balance ?? 0}
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#322452] via-[#543d7a] to-[#7b67d8] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Gem className="size-3.5" /> Подарки под характер
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.88] tracking-[-0.075em]">
          ДЕСЯТЬ
          <br />
          АРТЕФАКТОВ.
        </h2>
        <p className="mt-3 max-w-64 text-[10px] leading-5 text-white/75">
          Лимитированная серия игровых предметов. Это коллекция, а не рейтинг и не
          финансовый актив.
        </p>
      </section>

      {unboxedInstances.length > 0 && (
        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between">
            <span>
              <h2 className="text-sm font-black">Твоя полка</h2>
              <p className="mt-0.5 text-[10px] text-[#82758a]">
                Полученные экземпляры · даритель остаётся приватным
              </p>
            </span>
            <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
              {unboxedInstances.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {unboxedInstances.slice(0, 9).flatMap((instance) => {
              const artifact = seriesById.get(instance.series_id);
              return artifact
                ? [
                    <article
                      className="border-[#2c2036]/9 overflow-hidden rounded-2xl border bg-white shadow-[0_6px_16px_rgba(69,43,94,.05)]"
                      key={instance.id}
                    >
                      <AnimatedArtifact
                        className="aspect-square w-full"
                        orbit={artifact.rarity === "iconic"}
                        rarity={artifact.rarity}
                        src={artifact.artwork_path}
                      />
                      <span className="block p-2">
                        <b className="block truncate text-[9px]">{artifact.title}</b>
                        <small className="mt-0.5 block text-[8px] font-black text-[#8753e6]">
                          #{instance.serial_number} / {artifact.total_edition}
                        </small>
                        <small className="mt-1 block text-[8px] text-[#82758a]">
                          Получен{" "}
                          {new Intl.DateTimeFormat("ru-RU", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(instance.issued_at))}
                        </small>
                        <form
                          action={setCollectibleArtifactProfileDisplay}
                          className="mt-2"
                        >
                          <input name="instance_id" type="hidden" value={instance.id} />
                          <input
                            name="display_on_profile"
                            type="hidden"
                            value={instance.display_on_profile ? "false" : "true"}
                          />
                          <button
                            className={`flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[8px] font-black ${
                              instance.display_on_profile
                                ? "bg-[#f0e9ff] text-[#7549d0]"
                                : "bg-[#f3eef7] text-[#756a7d]"
                            }`}
                            type="submit"
                          >
                            {instance.display_on_profile ? (
                              <>
                                <Eye className="size-2.5" /> В профиле
                              </>
                            ) : (
                              <>
                                <EyeOff className="size-2.5" /> Скрыт
                              </>
                            )}
                          </button>
                        </form>
                      </span>
                    </article>,
                  ]
                : [];
            })}
          </div>
        </section>
      )}

      {topGifts.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <span>
              <h2 className="text-sm font-black">🔥 Популярные подарки</h2>
              <p className="mt-0.5 text-[10px] text-[#82758a]">Их дарят чаще всего</p>
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {topGifts.map((artifact) => (
              <Link
                className="border-[#2c2036]/9 group w-32 shrink-0 overflow-hidden rounded-2xl border bg-white shadow-[0_6px_16px_rgba(69,43,94,.05)] transition hover:-translate-y-0.5"
                href={`/collection/${artifact.slug}` as Route}
                key={artifact.id}
              >
                <AnimatedArtifact
                  className="aspect-square w-full"
                  rarity={artifact.rarity}
                  src={artifact.artwork_path}
                />
                <span className="block p-2">
                  <b className="block truncate text-[9px]">{artifact.title}</b>
                  <small className="mt-0.5 flex items-center gap-1 text-[8px] font-black text-[#8753e6]">
                    <Heart className="size-2.5" /> {artifact.times_sent ?? 0}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Подарки</h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">
              Подбери подарок под характер человека
            </p>
          </span>
          <Link className="text-[10px] font-black text-[#8753e6]" href="/people">
            К людям <ChevronRight className="inline size-3.5" />
          </Link>
        </div>

        <nav className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          <Link
            className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black transition ${
              activeCollection === "all"
                ? "bg-gradient-to-r from-[#8254ed] to-[#ff5d9a] text-white shadow-[0_4px_12px_rgba(160,75,213,.3)]"
                : "border border-[#2c2036]/10 bg-white text-[#756a7d]"
            }`}
            href="/collection"
          >
            Все
          </Link>
          {GIFT_COLLECTIONS.map((collection) => (
            <Link
              className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black transition ${
                activeCollection === collection.slug
                  ? "bg-gradient-to-r from-[#8254ed] to-[#ff5d9a] text-white shadow-[0_4px_12px_rgba(160,75,213,.3)]"
                  : "border border-[#2c2036]/10 bg-white text-[#756a7d]"
              }`}
              href={`/collection?collection=${collection.slug}` as Route}
              key={collection.slug}
            >
              {collection.icon} {collection.label}
            </Link>
          ))}
        </nav>

        {groups.map((group) => {
          const found = GIFT_COLLECTIONS.find((item) => item.slug === group.slug);
          const meta = found
            ? { label: `${found.icon} ${found.label}`, tagline: found.tagline }
            : { label: group.slug, tagline: "" };
          return (
            <section className="mt-5" key={group.slug}>
              <div className="mb-2.5 flex items-baseline justify-between">
                <h3 className="text-xs font-black">{meta.label}</h3>
                <span className="text-[9px] font-bold text-[#8b6a9c]">
                  {meta.tagline}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {group.items.map((artifact) => {
                  const owned = ownedBySeries.get(artifact.id)?.length ?? 0;
                  return <Card key={artifact.id} artifact={artifact} owned={owned} />;
                })}
              </div>
            </section>
          );
        })}
      </section>

      <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Предметы не продаются, не обмениваются и не дают игровых статов. Номер
          экземпляра выдаётся атомарно только после вручения.
        </p>
      </section>
    </main>
  );
}
