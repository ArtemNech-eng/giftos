import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, Flame, Trophy, UsersRound } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { PlaceIcon } from "@/components/place-icon";

export const metadata = {
  title: "Рейтинги",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type LeaderPlace = {
  id: string;
  city_id: string;
  name: string;
  icon_code: string;
  kind: "fixed" | "personal" | "temporary";
  popularity_score: number;
  member_count: number;
  online_count: number;
};

function RankMark({ rank }: { rank: number }) {
  return rank <= 3 ? (
    <span className="grid size-7 place-items-center rounded-full bg-[#2a2215] text-[#ffd35e]">
      <Trophy className="size-3.5" />
    </span>
  ) : (
    <span className="grid size-7 place-items-center text-xs font-semibold text-[#aaa4b7]">
      {rank}
    </span>
  );
}

export default async function PlacesLeaderboardPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();

  const { data: rawLeaderboard } = await supabase
    .from("public_place_leaderboard")
    .select(
      "id, city_id, name, icon_code, kind, popularity_score, member_count, online_count",
    )
    .limit(30);
  const leaderboard = (rawLeaderboard ?? []) as LeaderPlace[];
  const myCityPlaces = profile?.city_id
    ? leaderboard.filter((place) => place.city_id === profile.city_id)
    : [];
  const topPlaces = myCityPlaces.slice(0, 10);

  // Most active users in my city (by messages in places).
  let activeUsers: Array<{ profile_id: string; messages: number }> = [];
  if (profile?.city_id) {
    const { data: placeIds } = await supabase
      .from("places")
      .select("id")
      .eq("city_id", profile.city_id)
      .eq("is_active", true)
      .limit(100);
    const ids = (placeIds ?? []).map((row) => row.id);
    if (ids.length > 0) {
      const { data: rawMessages } = await supabase
        .from("place_messages")
        .select("author_id")
        .in("place_id", ids)
        .limit(500);
      const counts = new Map<string, number>();
      for (const row of rawMessages ?? [])
        counts.set(row.author_id, (counts.get(row.author_id) ?? 0) + 1);
      activeUsers = [...counts.entries()]
        .map(([profile_id, messages]) => ({ profile_id, messages }))
        .sort((a, b) => b.messages - a.messages)
        .slice(0, 10);
    }
  }
  const activeIds = activeUsers.map((row) => row.profile_id);
  const { data: activeProfiles } = activeIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", activeIds)
    : { data: [] };
  const profileById = new Map((activeProfiles ?? []).map((row) => [row.id, row]));

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/places"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Рейтинги</h1>
        <span className="w-9" />
      </header>

      <section className="mt-6">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-[#ffd35e]" />
          <h2 className="font-bold">Лидеры тусовок</h2>
        </div>
        {topPlaces.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              actionHref="/places"
              actionLabel="К местам"
              description="Лидеры появятся, когда в местах начнётся активность."
              title="Пока пусто"
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {topPlaces.map((place, index) => (
              <Link
                className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#171923] p-3"
                href={`/places/${place.id}` as Route}
                key={place.id}
              >
                <RankMark rank={index + 1} />
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#3b193d] to-[#1f1a38] text-[#e5c3ff]">
                  <PlaceIcon className="size-5" code={place.icon_code} />
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-sm font-bold">{place.name}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-[#aaa4b7]">
                    <span className="inline-flex items-center gap-1">
                      <UsersRound className="size-3.5" /> {place.member_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Flame className="size-3.5" /> {place.popularity_score}
                    </span>
                    {place.online_count > 0 && (
                      <span className="text-[#8df0b4]">
                        {place.online_count} сейчас
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-7">
        <div className="flex items-center gap-2">
          <Flame className="size-5 text-[#ff7b9c]" />
          <h2 className="font-bold">Самые активные · {profile?.city ?? "город"}</h2>
        </div>
        {activeUsers.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-[#aaa2b4]">
            Активность в местах вашего города появится здесь.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {activeUsers.map((row, index) => {
              const person = profileById.get(row.profile_id);
              if (!person) return null;
              return (
                <Link
                  className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#171923] p-3"
                  href={`/u/${person.username}` as Route}
                  key={row.profile_id}
                >
                  <RankMark rank={index + 1} />
                  <span className="min-w-0 grow">
                    <span className="block truncate text-sm font-bold">
                      {person.display_name}
                      {row.profile_id === user.id && (
                        <span className="ml-2 text-xs font-normal text-[#ffd35e]">
                          это вы
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-[#aaa4b7]">
                      {row.messages} сообщений в местах
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
