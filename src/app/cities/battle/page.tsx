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

type FinishedSeason = {
  name: string;
  winner_city_name: string | null;
  winner_city_id: string | null;
  winner_points: number | null;
  finished_at: string | null;
};

export default async function CityBattlePage() {
  const { supabase, user } = await requireUser();

  const [{ data: season }, { data: rawFinished }] = await Promise.all([
    supabase
      .from("city_seasons")
      .select("id, name, started_at, ended_at")
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("city_seasons")
      .select("name, winner_city_name, winner_city_id, winner_points, finished_at")
      .not("winner_city_id", "is", null)
      .order("finished_at", { ascending: false })
      .limit(10),
  ]);
  const finishedSeasons = (rawFinished ?? []) as FinishedSeason[];
  const lastFinished = finishedSeasons[0] ?? null;

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

      {lastFinished && (
        <section
          className={`mt-6 rounded-2xl border p-4 ${
            myCityId && lastFinished.winner_city_id === myCityId
              ? "border-[#ffd35e]/40 bg-gradient-to-r from-[#2b2413] to-[#221a10]"
              : "border-white/10 bg-[#171923]"
          }`}
        >
          <p className="text-sm font-bold">
            🏆 {lastFinished.winner_city_name} — победитель сезона «{lastFinished.name}»
          </p>
          <p className="mt-1 text-xs leading-5 text-[#b8b0c3]">
            {myCityId && lastFinished.winner_city_id === myCityId
              ? "Это наша общая победа — кубок остаётся в городе. Защитим его в новом сезоне!"
              : "Награда общая — «мы выиграли вместе». В новом сезоне можем обойти!"}
          </p>
        </section>
      )}

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
              description={
                season
                  ? "Баллы появятся, когда жители городов начнут действовать."
                  : "Новый сезон скоро начнётся — и ваш город сможет побороться за кубок."
              }
              title={season ? "Сезон только начался" : "Между сезонами"}
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

      <section className="mt-6">
        <h2 className="font-bold">Кубок города</h2>
        <p className="mt-1 text-xs text-[#9991a3]">
          Победители завершённых сезонов — награда общая, «мы выиграли вместе»
        </p>
        {finishedSeasons.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-[#aaa2b4]">
            Первый сезон ещё не завершён — именно ваш город может забрать кубок!
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {finishedSeasons.map((finished) => (
              <div
                className="border-white/8 flex items-center gap-3 rounded-xl border bg-[#171923] p-3"
                key={finished.name + (finished.finished_at ?? "")}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffd35e]/15 text-xl">
                  🏆
                </span>
                <span className="min-w-0 grow">
                  <b className="block truncate text-sm">
                    {finished.winner_city_name ?? "Город"}
                  </b>
                  <small className="text-xs text-[#9991a3]">
                    {finished.name} ·{" "}
                    {Number(finished.winner_points ?? 0).toLocaleString("ru-RU")} баллов
                  </small>
                </span>
                {finished.finished_at && (
                  <span className="shrink-0 text-xs text-[#9991a3]">
                    {new Intl.DateTimeFormat("ru-RU", {
                      day: "numeric",
                      month: "short",
                    }).format(new Date(finished.finished_at))}
                  </span>
                )}
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
