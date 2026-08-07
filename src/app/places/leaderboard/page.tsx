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
    <span className="grid size-7 place-items-center rounded-full bg-[#fff6d9] text-[#b8860b]">
      <Trophy className="size-3.5" />
    </span>
  ) : (
    <span className="grid size-7 place-items-center text-xs font-black text-[#81748a]">
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
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к местам"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/places"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Жизнь мест
          </small>
          <h1 className="mt-0.5 text-sm font-black">Рейтинги</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <Flame className="size-4.5" />
        </span>
      </header>

      <section className="mt-6">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-[#b8860b]" />
          <h2 className="text-sm font-black">Лидеры тусовок</h2>
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
                className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                href={`/places/${place.id}` as Route}
                key={place.id}
              >
                <RankMark rank={index + 1} />
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f3ecff] text-[#8753e6]">
                  <PlaceIcon className="size-5" code={place.icon_code} />
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-xs font-black">
                    {place.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[10px] text-[#81748a]">
                    <span className="inline-flex items-center gap-1">
                      <UsersRound className="size-3.5" /> {place.member_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Flame className="size-3.5" /> {place.popularity_score}
                    </span>
                    {place.online_count > 0 && (
                      <span className="text-[#258b82]">
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
          <Flame className="size-5 text-[#e2574c]" />
          <h2 className="text-sm font-black">
            Самые активные · {profile?.city ?? "город"}
          </h2>
        </div>
        {activeUsers.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-[#cdbbe7] bg-white p-5 text-xs text-[#756a7d]">
            Активность в местах вашего города появится здесь.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {activeUsers.map((row, index) => {
              const person = profileById.get(row.profile_id);
              if (!person) return null;
              return (
                <Link
                  className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                  href={`/u/${person.username}` as Route}
                  key={row.profile_id}
                >
                  <RankMark rank={index + 1} />
                  <span className="min-w-0 grow">
                    <span className="block truncate text-xs font-black">
                      {person.display_name}
                      {row.profile_id === user.id && (
                        <span className="ml-2 rounded-full bg-[#f0e9ff] px-1.5 py-0.5 text-[8px] font-black text-[#7549d0]">
                          это вы
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-[#81748a]">
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
