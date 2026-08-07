import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Eye,
  Flame,
  Gift,
  Heart,
  Sparkles,
  WalletCards,
} from "lucide-react";
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

const REACTIONS: { code: string; label: string; icon: typeof Heart }[] = [
  { code: "heart", label: "Сердце", icon: Heart },
  { code: "fire", label: "Огонь", icon: Flame },
  { code: "wow", label: "Удивление", icon: Sparkles },
];

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
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к story"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href={`/stories/${story.id}`}
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Сводка публикации
          </small>
          <h1 className="mt-0.5 text-sm font-black">Аналитика story</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <BarChart3 className="size-4.5" />
        </span>
      </header>

      <section className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <p className="text-xs font-black leading-5">{story.caption ?? "Video story"}</p>
        <p className="mt-1.5 text-[10px] text-[#81748a]">
          Создана{" "}
          {new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(story.created_at))}
        </p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <Eye className="size-5 text-[#8753e6]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Просмотры</p>
          <b className="mt-1 block text-2xl font-black">{views ?? 0}</b>
        </div>
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <Heart className="size-5 text-[#d84b81]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Реакции</p>
          <b className="mt-1 block text-2xl font-black">{totalReactions}</b>
        </div>
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <Gift className="size-5 text-[#b8860b]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Подарки</p>
          <b className="mt-1 block text-2xl font-black">{gifts?.length ?? 0}</b>
        </div>
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <WalletCards className="size-5 text-[#7549d0]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Доход</p>
          <b className="mt-1 block text-lg font-black">
            {formatRubles(giftIncome + unlockIncome)}
          </b>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-black">Реакции</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {REACTIONS.map((reaction) => (
            <div
              className="border-[#2c2036]/9 rounded-2xl border bg-white p-3 text-center shadow-[0_6px_18px_rgba(69,43,94,.05)]"
              key={reaction.code}
            >
              <reaction.icon className="mx-auto size-5 text-[#8753e6]" />
              <b className="mt-1.5 block text-sm font-black">
                {reactionCount(reaction.code)}
              </b>
              <span className="mt-0.5 block text-[9px] text-[#81748a]">
                {reaction.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {(rawViewers?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-black">Зрители</h2>
          <div className="mt-3 space-y-2">
            {(rawViewers ?? []).map((viewer) => (
              <div
                className="border-[#2c2036]/9 flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                key={viewer.viewer_id}
              >
                <span className="text-xs font-black text-[#5f5369]">
                  {viewerNames.get(viewer.viewer_id) ?? "Пользователь"}
                </span>
                <span className="text-[10px] text-[#81748a]">
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
          <h2 className="text-sm font-black">Открыли платную</h2>
          <div className="mt-3 space-y-2">
            {(rawUnlockers ?? []).map((unlocker) => (
              <div
                className="border-[#2c2036]/9 flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                key={unlocker.viewer_id}
              >
                <span className="text-xs font-black text-[#5f5369]">
                  {viewerNames.get(unlocker.viewer_id) ?? "Пользователь"}
                </span>
                <span className="text-[10px] text-[#81748a]">
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
          <h2 className="text-sm font-black">Открытия по дням</h2>
          <p className="mt-1 text-[10px] text-[#81748a]">
            Последние 14 дней, время — Москва
          </p>
          <div className="border-[#2c2036]/9 mt-3 flex h-28 items-end gap-1.5 rounded-2xl border bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
            {last14Days.map((day) => (
              <div
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                key={day.key}
              >
                <span className="text-[10px] font-black text-[#7549d0]">
                  {day.count > 0 ? day.count : ""}
                </span>
                <div
                  className="w-full rounded-md bg-gradient-to-t from-[#8254ed] to-[#ff5d9a]"
                  style={{
                    height: `${Math.max(4, (day.count / maxDaily) * 100)}%`,
                    opacity: day.count > 0 ? 1 : 0.12,
                  }}
                  title={`${day.label}: ${day.count} открытий`}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {sortedDays.map(([key, bucket]) => (
              <div
                className="border-[#2c2036]/9 flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                key={key}
              >
                <span className="text-xs font-black text-[#5f5369]">
                  {new Intl.DateTimeFormat("ru-RU", {
                    timeZone: "Europe/Moscow",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(`${key}T12:00:00`))}
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <span className="text-[#81748a]">{bucket.count} откр.</span>
                  <b className="font-black text-[#7549d0]">
                    {formatRubles(bucket.income)}
                  </b>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-black">Монетизация</h2>
        <div className="mt-3 space-y-2">
          {[
            { label: "Открытия платной story", value: String(unlockedCount) },
            { label: "Доход от открытий", value: formatRubles(unlockIncome) },
            { label: "Доход от подарков", value: formatRubles(giftIncome) },
          ].map((row) => (
            <div
              className="border-[#2c2036]/9 flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
              key={row.label}
            >
              <span className="text-[10px] text-[#5f5369]">{row.label}</span>
              <b className="text-xs font-black text-[#7549d0]">{row.value}</b>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-7 flex items-center gap-2 text-[10px] leading-5 text-[#8a7d91]">
        <BarChart3 className="size-4 shrink-0" /> Все показатели и доход тестовые.
        Реальная аналитика и выплаты подключаются после production payment stack.
      </p>
    </main>
  );
}
