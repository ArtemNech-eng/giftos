import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeft,
  Flame,
  Heart,
  Home,
  Mic2,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Рейтинги города",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type RankRow = {
  city_id: string;
  category: string;
  profile_id: string;
  display_name: string;
  username: string;
  avatar_path: string | null;
  is_creator: boolean;
  score: number;
  rank: number;
};

const CATEGORIES = [
  { key: "top", label: "👑 Топ города", icon: Trophy },
  { key: "hangout", label: "🏠 Тусовки", icon: Home },
  { key: "streamer", label: "🎤 Эфиры", icon: Mic2 },
  { key: "rising", label: "📈 Растущие", icon: TrendingUp },
  { key: "social", label: "🤝 Общительные", icon: Heart },
  { key: "discovery", label: "🌟 Открытия", icon: Sparkles },
  { key: "favorite", label: "❤️ Любимцы", icon: Heart },
] as const;

export default async function CityRankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const { tab: rawTab = "" } = await searchParams;
  const tab = CATEGORIES.some((c) => c.key === rawTab) ? rawTab : "top";
  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();

  let cityName: string | null = null;
  let rows: RankRow[] = [];
  if (profile?.city_id) {
    const { data: cityRow } = await supabase
      .from("cities")
      .select("name")
      .eq("id", profile.city_id)
      .maybeSingle();
    cityName = cityRow?.name ?? profile.city ?? null;
    const { data: rawRows } = await supabase
      .from("public_city_rankings")
      .select(
        "city_id, category, profile_id, display_name, username, avatar_path, is_creator, score, rank",
      )
      .eq("city_id", profile.city_id)
      .eq("category", tab)
      .limit(20);
    rows = (rawRows ?? []) as RankRow[];
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/places"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">🏆 {cityName ?? "Город"}</h1>
        <span className="w-9" />
      </header>

      <div className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#14161f] p-1">
        {CATEGORIES.map((category) => (
          <Link
            className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold ${
              tab === category.key
                ? "bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] text-white"
                : "text-[#aaa4b7]"
            }`}
            href={`/city/rankings?tab=${category.key}`}
            key={category.key}
          >
            {category.label}
          </Link>
        ))}
      </div>

      <section className="mt-5">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-[#aaa2b4]">
            В этой категории пока нет участников — станьте первым!
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <Link
                className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#171923] p-3"
                href={`/u/${row.username}` as Route}
                key={row.profile_id}
              >
                <span className="w-8 text-center text-lg">
                  {medals[row.rank - 1] ?? `#${row.rank}`}
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3b193d] to-[#1f1a38] text-sm font-bold">
                  {row.display_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-sm font-bold">
                    {row.display_name}
                    {row.profile_id === user.id && (
                      <span className="ml-2 text-xs font-normal text-[#ffd35e]">
                        это вы
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-[#aaa4b7]">
                    {row.is_creator ? "🎤 Автор" : "Житель города"}
                  </span>
                </span>
                <b className="shrink-0 text-sm text-[#ffd35e]">{row.score}</b>
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs leading-5 text-[#9f97aa]">
        <Flame className="size-4" /> Рейтинг отражает реальную активность и вклад в
        жизнь города. Его нельзя купить — VIP и продвижение лишь помогают получить
        больше внимания.
      </p>
    </main>
  );
}
