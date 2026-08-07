import Link from "next/link";
import {
  ArrowLeft,
  Film,
  Heart,
  Medal,
  Radio,
  Target,
  Trophy,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";

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

const POINT_RULES = [
  { icon: UserRound, label: "Заполнить профиль", points: 50 },
  { icon: UserPlus, label: "Пригласить друга (станет активным)", points: 100 },
  { icon: Radio, label: "Начать эфир", points: 30 },
  { icon: Target, label: "Опубликовать сбор", points: 20 },
  { icon: Film, label: "Опубликовать story", points: 15 },
  { icon: Heart, label: "Создать желание", points: 10 },
];

const MEDAL_TINTS = [
  { bg: "bg-[#fff6d9]", text: "text-[#b8860b]" },
  { bg: "bg-[#eef1f5]", text: "text-[#8a93a3]" },
  { bg: "bg-[#f7ede2]", text: "text-[#b0713a]" },
];

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
  const myCityWon = Boolean(myCityId && lastFinished?.winner_city_id === myCityId);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться в город"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/feed"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Сезонное соревнование
          </small>
          <h1 className="mt-0.5 text-sm font-black">Битва городов</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#fff0f6] text-[#d84b81]">
          <Trophy className="size-4.5" />
        </span>
      </header>

      {lastFinished && (
        <section
          className={`mt-5 overflow-hidden rounded-[1.7rem] border p-4 shadow-[0_10px_26px_rgba(69,43,94,.08)] ${
            myCityWon
              ? "border-[#ffd35e]/50 bg-gradient-to-br from-[#fff6d9] to-[#fdf0ff]"
              : "border-[#2c2036]/9 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                myCityWon
                  ? "bg-[#ffd35e]/30 text-[#b8860b]"
                  : "bg-[#f0e9ff] text-[#8753e6]"
              }`}
            >
              <Trophy className="size-5" />
            </span>
            <div className="min-w-0 grow">
              <p className="text-xs font-black">
                {lastFinished.winner_city_name} — победитель сезона «{lastFinished.name}
                »
              </p>
              <p className="mt-1 text-[10px] leading-4 text-[#756a7d]">
                {myCityWon
                  ? "Это наша общая победа — кубок остаётся в городе. Защитим его в новом сезоне!"
                  : "Награда общая — «мы выиграли вместе». В новом сезоне можем обойти!"}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#332452] via-[#58407f] to-[#8069d9] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <Trophy className="size-3.5" /> {season?.name ?? "Сезон"}
        </span>
        {myEntry ? (
          <>
            <p className="mt-3 text-4xl font-black tracking-[-0.04em]">
              {myPlace + 1}-е место
            </p>
            <p className="mt-1.5 text-[11px] text-white/75">
              {myCityName} · {myEntry.points.toLocaleString("ru-RU")} баллов
            </p>
            {leader && gapToLeader > 0 && (
              <div className="mt-4 rounded-2xl bg-black/20 p-3 text-[10px] leading-5 text-white/85">
                До первого места —{" "}
                <b className="text-[#ffd35e]">
                  {gapToLeader.toLocaleString("ru-RU")} баллов
                </b>
                . Пригласи друга и помоги {myCityName} победить!
              </div>
            )}
            {leader && gapToLeader === 0 && (
              <div className="mt-4 rounded-2xl bg-black/20 p-3 text-[10px] leading-5 text-[#9df0c3]">
                Ваш город лидирует! Удержим первое место.
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-[11px] leading-5 text-white/75">
            {myCityName
              ? `Город ${myCityName} пока не набрал баллов — создавайте желания, эфиры и приглашайте друзей!`
              : "Укажите город в профиле, чтобы участвовать в битве городов."}
          </p>
        )}
      </section>

      <section className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
            <UsersRound className="size-4" />
          </span>
          <span>
            <h2 className="text-xs font-black">Как заработать баллы городу</h2>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              Только реальные действия жителей
            </p>
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {POINT_RULES.map((rule) => (
            <div
              className="flex items-center gap-2.5 rounded-xl bg-[#fbf9fe] px-3 py-2 text-[10px] text-[#5f5369]"
              key={rule.label}
            >
              <rule.icon className="size-3.5 shrink-0 text-[#8753e6]" />
              <span className="min-w-0 grow">{rule.label}</span>
              <b className="shrink-0 font-black text-[#7549d0]">+{rule.points}</b>
            </div>
          ))}
        </div>
        <Link
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(160,75,213,.24)]"
          href={
            myCityName ? `/bonuses?city=${encodeURIComponent(myCityName)}` : "/bonuses"
          }
        >
          <UserPlus className="size-4" /> Пригласить друга
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-black">Таблица лидеров</h2>
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
            {entries.slice(0, 20).map((entry, index) => {
              const medalTint = MEDAL_TINTS[index] ?? null;
              return (
                <div
                  className={`flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)] ${
                    entry.city_id === myCityId
                      ? "border-[#a67ae7] bg-gradient-to-r from-[#f6efff] to-[#fff6fb]"
                      : "border-[#2c2036]/9"
                  }`}
                  key={entry.city_id}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl ${
                      medalTint ? medalTint.bg : "bg-[#f3ecff]"
                    }`}
                  >
                    {medalTint ? (
                      <Medal
                        className={`size-4 ${medalTint.text} ${
                          index === 0 ? "fill-current" : ""
                        }`}
                      />
                    ) : (
                      <span className="text-xs font-black text-[#5f5369]">
                        {index + 1}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 grow truncate text-xs font-black">
                    {entry.name}
                    {entry.city_id === myCityId && (
                      <span className="ml-2 rounded-full bg-[#f0e9ff] px-1.5 py-0.5 text-[8px] font-black text-[#7549d0]">
                        ваш город
                      </span>
                    )}
                  </span>
                  <b className="shrink-0 text-xs font-black text-[#8753e6]">
                    {entry.points.toLocaleString("ru-RU")}
                  </b>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-[#b8860b]" />
          <h2 className="text-sm font-black">Кубок города</h2>
        </div>
        <p className="mt-1 text-[10px] text-[#81748a]">
          Победители завершённых сезонов — награда общая, «мы выиграли вместе»
        </p>
        {finishedSeasons.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[#cdbbe7] bg-white p-5 text-xs leading-5 text-[#756a7d]">
            Первый сезон ещё не завершён — именно ваш город может забрать кубок!
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {finishedSeasons.map((finished) => (
              <div
                className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                key={finished.name + (finished.finished_at ?? "")}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff6d9] text-[#b8860b]">
                  <Trophy className="size-5" />
                </span>
                <span className="min-w-0 grow">
                  <b className="block truncate text-xs font-black">
                    {finished.winner_city_name ?? "Город"}
                  </b>
                  <small className="text-[10px] text-[#81748a]">
                    {finished.name} ·{" "}
                    {Number(finished.winner_points ?? 0).toLocaleString("ru-RU")} баллов
                  </small>
                </span>
                {finished.finished_at && (
                  <span className="shrink-0 text-[10px] text-[#81748a]">
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
        className="mt-7 flex items-center justify-center gap-2 text-sm font-black text-[#8753e6]"
        href="/feed"
      >
        <ArrowLeft className="size-4" /> К ленте
      </Link>
    </main>
  );
}
