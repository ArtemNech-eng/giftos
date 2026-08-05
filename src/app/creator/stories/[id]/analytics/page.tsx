import Link from "next/link";
import { ArrowLeft, BarChart3, Eye, Gift, Heart, WalletCards } from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Аналитика story",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Ledger = { creator_net_minor: number; source_type: string };

export default async function StoryAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: story } = await supabase
    .from("stories")
    .select("id, author_id, caption, created_at, expires_at, unlock_price_minor")
    .eq("id", id)
    .eq("author_id", user.id)
    .maybeSingle();
  if (!story) notFound();

  const [{ count: views }, { data: reactions }, { data: gifts }, { data: unlocks }] =
    await Promise.all([
      supabase
        .from("story_views")
        .select("*", { count: "exact", head: true })
        .eq("story_id", story.id),
      supabase.from("story_reactions").select("reaction").eq("story_id", story.id),
      supabase
        .from("story_gifts")
        .select("id, gift_code, price_minor")
        .eq("story_id", story.id),
      supabase.from("story_unlocks").select("id, status").eq("story_id", story.id),
    ]);
  const sourceIds = [
    ...(gifts ?? []).map((gift) => gift.id),
    ...(unlocks ?? []).map((unlock) => unlock.id),
  ];
  const { data: rawLedger } = sourceIds.length
    ? await supabase
        .from("creator_ledger_entries")
        .select("creator_net_minor, source_type")
        .eq("creator_id", user.id)
        .in("source_id", sourceIds)
    : { data: [] };
  const ledger = (rawLedger ?? []) as Ledger[];
  const giftIncome = ledger
    .filter((item) => item.source_type === "gift")
    .reduce((sum, item) => sum + Number(item.creator_net_minor), 0);
  const unlockIncome = ledger
    .filter((item) => item.source_type === "story_unlock")
    .reduce((sum, item) => sum + Number(item.creator_net_minor), 0);
  const reactionCount = (code: string) =>
    reactions?.filter((item) => item.reaction === code).length ?? 0;
  const totalReactions = reactions?.length ?? 0;
  const unlockedCount =
    unlocks?.filter((item) => item.status === "unlocked").length ?? 0;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href={`/stories/${story.id}`}
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Аналитика story</h1>
        <span className="w-9" />
      </header>
      <section className="mt-7 rounded-2xl border border-white/10 bg-[#171923] p-5">
        <p className="text-sm text-[#b9b1c5]">{story.caption ?? "Video story"}</p>
        <p className="mt-2 text-xs text-[#9991a3]">
          Создана{" "}
          {new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(story.created_at))}
        </p>
      </section>
      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <Eye className="size-5 text-[#9e88ff]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Просмотры</p>
          <b className="mt-1 block text-2xl">{views ?? 0}</b>
        </div>
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <Heart className="size-5 text-[#ff79b5]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Реакции</p>
          <b className="mt-1 block text-2xl">{totalReactions}</b>
        </div>
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <Gift className="size-5 text-[#ffd35e]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Подарки</p>
          <b className="mt-1 block text-2xl">{gifts?.length ?? 0}</b>
        </div>
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <WalletCards className="size-5 text-[#e17dff]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Доход</p>
          <b className="mt-1 block text-lg">
            {formatRubles(giftIncome + unlockIncome)}
          </b>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-bold">Реакции</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/5 p-3 text-center">
            ❤️<b className="mt-1 block">{reactionCount("heart")}</b>
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-center">
            🔥<b className="mt-1 block">{reactionCount("fire")}</b>
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-center">
            😮<b className="mt-1 block">{reactionCount("wow")}</b>
          </div>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-bold">Монетизация</h2>
        <div className="mt-3 space-y-2">
          <div className="border-white/8 flex justify-between rounded-xl border bg-[#171923] p-4">
            <span className="text-[#d6cede]">Открытия платной story</span>
            <b>{unlockedCount}</b>
          </div>
          <div className="border-white/8 flex justify-between rounded-xl border bg-[#171923] p-4">
            <span className="text-[#d6cede]">Доход от открытий</span>
            <b>{formatRubles(unlockIncome)}</b>
          </div>
          <div className="border-white/8 flex justify-between rounded-xl border bg-[#171923] p-4">
            <span className="text-[#d6cede]">Доход от подарков</span>
            <b>{formatRubles(giftIncome)}</b>
          </div>
        </div>
      </section>
      <p className="mt-7 flex items-center gap-2 text-xs leading-5 text-[#9f97aa]">
        <BarChart3 className="size-4" /> Все показатели и доход тестовые. Реальная
        аналитика и выплаты подключаются после production payment stack.
      </p>
    </main>
  );
}
