import Link from "next/link";
import type { Route } from "next";
import { MapPin, Plus, Trophy, UsersRound } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

export const metadata = {
  title: "Город",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const ONLINE_WINDOW = 15 * 60 * 1000; // 15 minutes soft online

type PlaceRow = {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  kind: "fixed" | "personal" | "temporary";
  creator_id: string | null;
  promoted_until: string | null;
};

export default async function PlacesPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();

  let places: Array<PlaceRow & { online: number; friends: number }> = [];
  let cityName: string | null = null;
  if (profile?.city_id) {
    const { data: cityRow } = await supabase
      .from("cities")
      .select("name")
      .eq("id", profile.city_id)
      .maybeSingle();
    cityName = cityRow?.name ?? profile.city ?? null;

    const { data: rawPlaces } = await supabase
      .from("places")
      .select("id, name, description, emoji, kind, creator_id, promoted_until")
      .eq("city_id", profile.city_id)
      .eq("is_active", true)
      .order("promoted_until", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(100);
    const rows = (rawPlaces ?? []) as PlaceRow[];

    const cutoff = new Date(Date.now() - ONLINE_WINDOW).toISOString();
    const [{ data: presence }, { data: members }, { data: myFollows }] =
      await Promise.all([
        supabase
          .from("place_presence")
          .select("place_id, profile_id")
          .gte("last_seen_at", cutoff),
        supabase.from("place_members").select("place_id, profile_id"),
        supabase.from("user_follows").select("following_id").eq("follower_id", user.id),
      ]);
    const followed = new Set((myFollows ?? []).map((row) => row.following_id));
    const onlineByPlace = new Map<string, number>();
    const friendsByPlace = new Map<string, number>();
    for (const row of presence ?? []) {
      onlineByPlace.set(row.place_id, (onlineByPlace.get(row.place_id) ?? 0) + 1);
      if (followed.has(row.profile_id))
        friendsByPlace.set(row.place_id, (friendsByPlace.get(row.place_id) ?? 0) + 1);
    }
    const memberSet = new Set(
      (members ?? []).map((row) => `${row.place_id}:${row.profile_id}`),
    );
    places = rows.map((place) => ({
      ...place,
      online: onlineByPlace.get(place.id) ?? 0,
      friends: friendsByPlace.get(place.id) ?? 0,
      joined: memberSet.has(`${place.id}:${user.id}`),
    }));
  }

  const now = Date.now();
  const sorted = [...places].sort((a, b) => {
    const aPromoted = a.promoted_until && new Date(a.promoted_until).getTime() > now;
    const bPromoted = b.promoted_until && new Date(b.promoted_until).getTime() > now;
    if (aPromoted !== bPromoted) return aPromoted ? -1 : 1;
    return b.online - a.online;
  });

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link className="text-sm text-[#e3a3d5]" href="/feed">
          ← Лента
        </Link>
        <h1 className="text-lg font-bold">📍 {cityName ?? "Город"}</h1>
        <Link
          aria-label="Создать место"
          className="grid size-9 place-items-center rounded-full bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff]"
          href="/places/new"
        >
          <Plus className="size-5" />
        </Link>
      </header>

      <p className="mt-5 text-sm leading-6 text-[#b9b1c5]">
        Пойдём посмотрим, кто сейчас в городе. Выбери место и заходи.
      </p>

      <section className="mt-5">
        {sorted.length === 0 ? (
          <EmptyState
            actionHref={profile?.city_id ? "/places/new" : "/onboarding"}
            actionLabel={profile?.city_id ? "Создать место" : "Указать город"}
            description={
              profile?.city_id
                ? "Мест пока нет — создайте первое."
                : "Укажите город в профиле, чтобы видеть места."
            }
            title={profile?.city_id ? "Город пуст" : "Город не указан"}
          />
        ) : (
          <div className="space-y-2.5">
            {sorted.map((place) => (
              <Link
                className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#171923] p-4 transition hover:border-[#8f48ff]/60"
                href={`/places/${place.id}` as Route}
                key={place.id}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#3b193d] to-[#1f1a38] text-2xl">
                  {place.emoji}
                </span>
                <span className="min-w-0 grow">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-bold">{place.name}</span>
                    {place.kind === "personal" && (
                      <span className="rounded-full bg-[#b550ff]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#e7c9f5]">
                        🏠
                      </span>
                    )}
                    {place.kind === "temporary" && (
                      <span className="rounded-full bg-[#ffd35e]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#ffd35e]">
                        🔥
                      </span>
                    )}
                    {place.promoted_until &&
                      new Date(place.promoted_until).getTime() > Date.now() && (
                        <span className="rounded-full bg-[#ffd35e]/25 px-1.5 py-0.5 text-[10px] font-semibold text-[#ffd35e]">
                          🚀 Поднято
                        </span>
                      )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-3 text-xs text-[#aaa4b7]">
                    <span className="inline-flex items-center gap-1">
                      <UsersRound className="size-3.5" /> {place.online} сейчас
                    </span>
                    {place.friends > 0 && (
                      <span className="text-[#ffd35e]">
                        Твои друзья: {place.friends}
                      </span>
                    )}
                  </span>
                </span>
                <span className="shrink-0 text-[#e3a3d5]">›</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Link
        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-[#e8a1d5]"
        href="/places/new"
      >
        <MapPin className="size-4" /> Создать свою тусовку
      </Link>
      <Link
        className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-[#ffd35e]"
        href="/places/leaderboard"
      >
        <Trophy className="size-4" /> Рейтинги города
      </Link>
    </main>
  );
}
