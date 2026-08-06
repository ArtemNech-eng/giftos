import Link from "next/link";
/* eslint-disable @next/next/no-img-element -- generated static pre-production artifact art */
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Gem,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { setCollectibleArtifactProfileDisplay } from "@/app/collection/actions";
import { requireUser } from "@/lib/auth";

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
  rarity: "limited" | "rare" | "iconic";
  total_edition: number;
  remaining_edition: number;
  price_stars: number;
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

export default async function CollectionPage() {
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
          "id, slug, title, description, artwork_path, rarity, total_edition, remaining_edition, price_stars",
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
            ARTIFACTS 01
          </small>
          <h1 className="mt-0.5 text-sm font-black">Коллекция</h1>
        </span>
        <span className="inline-flex h-10 items-center gap-1 rounded-full bg-[#f0e9ff] px-3 text-[10px] font-black text-[#7549d0]">
          <Sparkles className="size-3.5" /> {wallet?.available_balance ?? 0}
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#322452] via-[#543d7a] to-[#7b67d8] p-5 text-white shadow-[0_14px_30px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Gem className="size-3.5" /> Первые десять
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
                      <img
                        alt=""
                        className="aspect-[3/4] w-full object-cover"
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

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <span>
            <h2 className="text-sm font-black">Первая десятка</h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">
              Выбери предмет на профиле человека и подари его
            </p>
          </span>
          <Link className="text-[10px] font-black text-[#8753e6]" href="/people">
            К людям <ChevronRight className="inline size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {series.map((artifact) => {
            const owned = ownedBySeries.get(artifact.id)?.length ?? 0;
            return (
              <article
                className="border-[#2c2036]/9 overflow-hidden rounded-[1.4rem] border bg-white shadow-[0_8px_22px_rgba(69,43,94,.05)]"
                key={artifact.id}
              >
                <img
                  alt=""
                  className="aspect-[3/2] w-full object-cover"
                  src={artifact.artwork_path}
                />
                <div className="p-3">
                  <span className="inline-flex rounded-full bg-[#f0e9ff] px-1.5 py-0.5 text-[8px] font-black text-[#7549d0]">
                    {rarityLabel[artifact.rarity]}
                  </span>
                  <h3 className="mt-2 text-xs font-black">{artifact.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#756a7d]">
                    {artifact.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[9px] font-black">
                    <span className="text-[#8b6a9c]">
                      {artifact.remaining_edition} / {artifact.total_edition}
                    </span>
                    <span className="text-[#7549d0]">{artifact.price_stars} ⭐</span>
                  </div>
                  {owned > 0 && (
                    <p className="mt-2 flex items-center gap-1 text-[8px] font-black text-[#258b82]">
                      <Check className="size-3" /> В твоей коллекции: {owned}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
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
