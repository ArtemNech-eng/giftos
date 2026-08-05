import Link from "next/link";
import { ArrowLeft, Trophy, UsersRound } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

export const metadata = {
  title: "Битва городов",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Entry = {
  season_id: string;
  city_id: string;
  points: number;
  name: string;
};

export default async function CityBattlePage() {
  const { supabase, user } = await requireUser();

  const { data: season } = await supabase
    .from("city_seasons")
    .select("id, name, started_at, ended_at")
    .eq("is_active", true)
    .maybeSingle();

  let entries: Entry[] = [];
  let myCityId: string | null = null;
  let myCityName: string | null = null;

  if (season) {
    const { data: rawEntries } = await supabase
      .from("city_battle_entries")
      .select("season_id, city_id, points, cities!inner(name)")
      .eq("season_id", season.id)
      .order("points", { ascending: false })
      .limit(50);
    entries = (
      (rawEntries ?? []) as Array<{
        season_id: string;
        city_id: string;
        points: number;
        cities: Array<{ name: string }>;
      }>
    )
      .flatMap((row) =>
        row.cities?.[0]
          ? [
              {
                season_id: row.season_id,
                city_id: row.city_id,
                points: Number(row.points),
                name: row.cities[0].name,
              },
            ]
          : [],
      )
      .sort((a, b) => b.points - a.points);

    const { data: profile } = await supabase
      .from("profiles")
      .select("city_id, city")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.city_id) {
      myCityId = profile.city_id;
      const found = entries.find((entry) => entry.city_id === myCityId);
      if (!found) {
        const { data: myCity } = await supabase
          .from("cities")
          .select("name")
          .eq("id", profile.city_id)
          .maybeSingle();
        myCityName = myCity?.name ?? profile.city;
      } else {
        myCityName = found.name;
      }
    }
  }

  const myPlace = myCityId
    ? entries.findIndex((entry) => entry.city_id === myCityId)
    : -1;
  const myEntry = myPlace >= 0 ? entries[myPlace] : null;
  const leader = entries[0] ?? null;
  const gapToLeader = myEntry && leader ? leader.points - myEntry.points : 0;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/feed"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Битва городов</h1>
        <span className="w-9" />
      </header>

      <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-[#2b193f] to-[#181a2b] p-6 text-center">
        <Trophy className="mx-auto size-9 text-[#ffd35e]" />
        <p className="mt-3 text-sm text-[#c6bfd0]">{season?.name ?? "Сезон"}</p>
        {myEntry ? (
          <>
            <p className="mt-2 text-3xl font-bold">{myPlace + 1}-е место</p>
            <p className="mt-1 text-sm text-[#b8b0c3]">
              {myCityName} · {myEntry.points.toLocaleString("ru-RU")} баллов
            </p>
            {leader && gapToLeader > 0 && (
              <p className="mt-3 text-xs leading-5 text-[#ffd35e]">
                До первого места — {gapToLeader.toLocaleString("ru-RU")} баллов.
                Пригласи друга и помоги {myCityName} победить!
              </p>
            )}
            {leader && gapToLeader === 0 && (
              <p className="mt-3 text-xs leading-5 text-[#8df0b4]">
                Ваш город лидирует! Удержим первое место 🏆
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[#b8b0c3]">
            {myCityName
              ? `Город ${myCityName} пока не набрал баллов — создавайте желания, эфиры и приглашайте друзей!`
              : "Укажите город в профиле, чтобы участвовать в битве городов."}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[#ffd35e]/25 bg-[#1c1528] p-4">
        <div className="flex items-center gap-2">
          <UsersRound className="size-5 text-[#ffd35e]" />
          <p className="text-sm font-bold">Как заработать баллы городу</p>
        </div>
        <div className="mt-3 space-y-1.5 text-sm text-[#d8d0e0]">
          <p>✅ Заполнить профиль — 50</p>
          <p>✅ Пригласить друга (станет активным) — 100</p>
          <p>✅ Начать эфир — 30</p>
          <p>✅ Опубликовать сбор — 20</p>
          <p>✅ Опубликовать story — 15</p>
          <p>✅ Создать желание — 10</p>
        </div>
        <Link
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold"
          href={
            myCityName ? `/bonuses?city=${encodeURIComponent(myCityName)}` : "/bonuses"
          }
        >
          Пригласить друга ›
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="font-bold">Таблица лидеров</h2>
        {entries.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              actionHref="/feed"
              actionLabel="К ленте"
              description="Баллы появятся, когда жители городов начнут действовать."
              title="Сезон только начался"
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {entries.slice(0, 20).map((entry, index) => (
              <div
                className={`border-white/8 flex items-center gap-3 rounded-xl border bg-[#171923] p-3 ${
                  entry.city_id === myCityId ? "border-[#ffd35e]/50 bg-[#221d12]" : ""
                }`}
                key={entry.city_id}
              >
                <span className="w-8 text-center text-lg">
                  {medals[index] ?? `${index + 1}`}
                </span>
                <span className="min-w-0 grow truncate text-sm font-bold">
                  {entry.name}
                  {entry.city_id === myCityId && (
                    <span className="ml-2 text-xs font-normal text-[#ffd35e]">
                      ваш город
                    </span>
                  )}
                </span>
                <b className="shrink-0 text-sm text-[#ffd35e]">
                  {entry.points.toLocaleString("ru-RU")}
                </b>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-[#e8a1d5]"
        href="/feed"
      >
        <ArrowLeft className="size-4" /> К ленте
      </Link>
    </main>
  );
}
