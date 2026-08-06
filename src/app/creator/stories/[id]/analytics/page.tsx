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

type Ledger = {
  creator_net_minor: number;
  source_type: string;
  source_id: string;
};

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

  const [
    { count: views },
    { data: reactions },
    { data: gifts },
    { data: unlocks },
    { data: rawViewers },
    { data: rawUnlockers },
    { data: unlockTimeline },
  ] = await Promise.all([
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
    supabase
      .from("story_views")
      .select("viewer_id, viewed_at")
      .eq("story_id", story.id)
      .order("viewed_at", { ascending: false })
      .limit(10),
    supabase
      .from("story_unlocks")
      .select("viewer_id, unlocked_at")
      .eq("story_id", story.id)
      .eq("status", "unlocked")
      .order("unlocked_at", { ascending: false })
      .limit(10),
    supabase
      .from("story_unlocks")
      .select("id, unlocked_at")
      .eq("story_id", story.id)
      .eq("status", "unlocked")
      .order("unlocked_at", { ascending: true }),
  ]);
  const viewerIds = [
    ...new Set([
      ...(rawViewers ?? []).map((item) => item.viewer_id),
      ...(rawUnlockers ?? []).map((item) => item.viewer_id),
    ]),
  ];
  const { data: viewerProfiles } = viewerIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", viewerIds)
    : { data: [] };
  const viewerNames = new Map(
    (viewerProfiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );
  const sourceIds = [
    ...(gifts ?? []).map((gift) => gift.id),
    ...(unlocks ?? []).map((unlock) => unlock.id),
  ];
  const { data: rawLedger } = sourceIds.length
    ? await supabase
        .from("creator_ledger_entries")
        .select("creator_net_minor, source_type, source_id")
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

  // Unlock timeline: group paid unlocks by Moscow day, join ledger income.
  const ledgerBySource = new Map(
    (rawLedger ?? []).map((item) => [String(item.source_id), item]),
  );
  const unlockDay = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  const timeline = new Map<string, { count: number; income: number }>();
  for (const unlock of unlockTimeline ?? []) {
    if (!unlock.unlocked_at) continue;
    const key = unlockDay(unlock.unlocked_at);
    const entry = ledgerBySource.get(unlock.id);
    const bucket = timeline.get(key) ?? { count: 0, income: 0 };
    bucket.count += 1;
    if (entry) bucket.income += Number(entry.creator_net_minor ?? 0);
    timeline.set(key, bucket);
  }
  const last14Days: { key: string; label: string; count: number; income: number }[] =
    [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const key = unlockDay(new Date(Date.now() - offset * 86_400_000).toISOString());
    const bucket = timeline.get(key);
    last14Days.push({
      key,
      label: new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        day: "numeric",
        month: "short",
      }).format(new Date(Date.now() - offset * 86_400_000)),
      count: bucket?.count ?? 0,
      income: bucket?.income ?? 0,
    });
  }
  const maxDaily = Math.max(1, ...last14Days.map((day) => day.count));
  const sortedDays = [...timeline.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

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
      {(rawViewers?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="font-bold">Зрители</h2>
          <div className="mt-3 space-y-2">
            {(rawViewers ?? []).map((viewer) => (
              <div
                className="border-white/8 flex items-center justify-between rounded-xl border bg-[#171923] p-3"
                key={viewer.viewer_id}
              >
                <span className="text-sm text-[#d6cede]">
                  {viewerNames.get(viewer.viewer_id) ?? "Пользователь"}
                </span>
                <span className="text-xs text-[#9991a3]">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(viewer.viewed_at))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      {(rawUnlockers?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="font-bold">Открыли платную</h2>
          <div className="mt-3 space-y-2">
            {(rawUnlockers ?? []).map((unlocker) => (
              <div
                className="border-white/8 flex items-center justify-between rounded-xl border bg-[#171923] p-3"
                key={unlocker.viewer_id}
              >
                <span className="text-sm text-[#d6cede]">
                  {viewerNames.get(unlocker.viewer_id) ?? "Пользователь"}
                </span>
                <span className="text-xs text-[#9991a3]">
                  {unlocker.unlocked_at
                    ? new Intl.DateTimeFormat("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(unlocker.unlocked_at))
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      {unlockedCount > 0 && (
        <section className="mt-6">
          <h2 className="font-bold">Открытия по дням</h2>
          <p className="mt-1 text-xs text-[#9991a3]">
            Последние 14 дней, время — Москва
          </p>
          <div className="mt-3 flex h-28 items-end gap-1.5 rounded-2xl bg-white/5 p-3">
            {last14Days.map((day) => (
              <div
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                key={day.key}
              >
                <span className="text-[10px] font-semibold text-[#d6cede]">
                  {day.count > 0 ? day.count : ""}
                </span>
                <div
                  className="w-full rounded-md bg-gradient-to-t from-[#7d45ff] to-[#ff4b8a]"
                  style={{
                    height: `${Math.max(4, (day.count / maxDaily) * 100)}%`,
                    opacity: day.count > 0 ? 1 : 0.15,
                  }}
                  title={`${day.label}: ${day.count} открытий`}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {sortedDays.map(([key, bucket]) => (
              <div
                className="border-white/8 flex items-center justify-between rounded-xl border bg-[#171923] px-4 py-3"
                key={key}
              >
                <span className="text-sm text-[#d6cede]">
                  {new Intl.DateTimeFormat("ru-RU", {
                    timeZone: "Europe/Moscow",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(`${key}T12:00:00`))}
                </span>
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-[#9991a3]">{bucket.count} откр.</span>
                  <b>{formatRubles(bucket.income)}</b>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
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
