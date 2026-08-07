import Link from "next/link";
import type { Route } from "next";
/* eslint-disable @next/next/no-img-element -- avatar paths use short-lived signed Storage URLs */
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  Flame,
  Heart,
  Home,
  MapPin,
  Mic2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  UsersRound,
} from "lucide-react";

import { CityPulseRefresh } from "@/components/city-pulse-refresh";
import { LocalRoleIcon } from "@/components/local-role-icon";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";

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
type LocalCreatorRow = {
  id: string;
  role_code: string;
  city_label: string | null;
  headline: string | null;
};
type RankedPerson = RankRow & {
  avatarUrl: string | null;
  roleCode: string | null;
  identity: string;
};

const CATEGORIES = [
  {
    key: "top",
    label: "Главное",
    title: "Лица города",
    description: "Кого сейчас чаще замечают в публичной городской жизни.",
    rowCopy: "Заметен(на) в городской сцене",
    icon: Trophy,
    tone: "bg-[#f3ebff] text-[#7549d0]",
  },
  {
    key: "rising",
    label: "Рост недели",
    title: "Кто растёт",
    description: "Новая публичная активность и внимание за последние семь дней.",
    rowCopy: "Движение за эту неделю",
    icon: TrendingUp,
    tone: "bg-[#eaf7f5] text-[#258b82]",
  },
  {
    key: "social",
    label: "В разговоре",
    title: "Где идёт разговор",
    description: "Люди, которые общаются и появляются в открытых местах города.",
    rowCopy: "В разговорах города",
    icon: UsersRound,
    tone: "bg-[#fff1f6] text-[#d84b81]",
  },
  {
    key: "hangout",
    label: "Тусовки",
    title: "Собирают своих",
    description: "Те, кто развивает живые места и городские тусовки.",
    rowCopy: "Развивает свою тусовку",
    icon: Home,
    tone: "bg-[#fff6e6] text-[#a87511]",
  },
  {
    key: "streamer",
    label: "Эфиры",
    title: "Голоса города",
    description: "Авторы, которые выходят к городу в публичный эфир.",
    rowCopy: "Выходит в эфир",
    icon: Mic2,
    tone: "bg-[#eaf0ff] text-[#4b69bd]",
  },
  {
    key: "discovery",
    label: "Открытия",
    title: "Новые имена",
    description: "Публичные профили, которые появились в городе недавно и уже заметны.",
    rowCopy: "Новое имя города",
    icon: Sparkles,
    tone: "bg-[#fff3e8] text-[#c16f2c]",
  },
  {
    key: "favorite",
    label: "Поддержка",
    title: "Любимцы своих",
    description: "Кого чаще поддерживают публичными подарками в сообществе.",
    rowCopy: "Получает поддержку от своих",
    icon: Heart,
    tone: "bg-[#fff0f5] text-[#cf4c7f]",
  },
] as const;

function PositionMark({ rank }: { rank: number }) {
  const topTone =
    rank === 1
      ? "bg-[#fff4d8] text-[#a87511]"
      : rank === 2
        ? "bg-[#edf0f7] text-[#66718b]"
        : rank === 3
          ? "bg-[#fff0e8] text-[#b66c42]"
          : "bg-[#f3eef7] text-[#796b82]";
  return (
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-2xl text-xs font-black ${topTone}`}
    >
      {rank === 1 ? <Crown className="size-4" /> : `#${rank}`}
    </span>
  );
}

function PersonAvatar({ person }: { person: RankedPerson }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] p-0.5">
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f8f4fc] text-xs font-black text-[#372c41]">
        {person.avatarUrl ? (
          <img
            loading="lazy"
            decoding="async"
            alt=""
            className="size-full object-cover"
            src={person.avatarUrl}
          />
        ) : (
          person.display_name.slice(0, 1).toUpperCase()
        )}
      </span>
    </span>
  );
}

export default async function CityRankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const { tab: rawTab = "" } = await searchParams;
  const activeCategory =
    CATEGORIES.find((category) => category.key === rawTab) ?? CATEGORIES[0];
  const activeKey = activeCategory.key;
  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();

  let cityName: string | null = null;
  let rankedPeople: RankedPerson[] = [];
  let myRank: RankedPerson | null = null;
  if (profile?.city_id) {
    const [cityResult, rowsResult, myRankResult] = await Promise.all([
      supabase.from("cities").select("name").eq("id", profile.city_id).maybeSingle(),
      supabase
        .from("public_city_rankings")
        .select(
          "city_id, category, profile_id, display_name, username, avatar_path, is_creator, score, rank",
        )
        .eq("city_id", profile.city_id)
        .eq("category", activeKey)
        .order("rank", { ascending: true })
        .limit(30),
      supabase
        .from("public_city_rankings")
        .select(
          "city_id, category, profile_id, display_name, username, avatar_path, is_creator, score, rank",
        )
        .eq("city_id", profile.city_id)
        .eq("category", activeKey)
        .eq("profile_id", user.id)
        .maybeSingle(),
    ]);
    cityName = cityResult.data?.name ?? profile.city ?? null;
    const rows = (rowsResult.data ?? []) as RankRow[];
    const myRawRank = myRankResult.data as RankRow | null;
    const profileIds = [
      ...new Set(
        [...rows, ...(myRawRank ? [myRawRank] : [])].map((row) => row.profile_id),
      ),
    ];
    const { data: rawLocalCreators } = profileIds.length
      ? await supabase
          .from("public_local_creators")
          .select("id, role_code, city_label, headline")
          .in("id", profileIds)
      : { data: [] as LocalCreatorRow[] };
    const creatorById = new Map(
      ((rawLocalCreators ?? []) as LocalCreatorRow[]).map((creator) => [
        creator.id,
        creator,
      ]),
    );
    const hydratePerson = async (row: RankRow): Promise<RankedPerson> => {
      const creator = creatorById.get(row.profile_id);
      return {
        ...row,
        avatarUrl: await getSignedImageUrl({
          bucket: "avatars",
          path: row.avatar_path,
        }),
        roleCode: creator?.role_code ?? null,
        identity:
          creator?.city_label ??
          creator?.headline ??
          (row.is_creator ? "Автор города" : "Житель города"),
      };
    };
    rankedPeople = await Promise.all(rows.map(hydratePerson));
    myRank = myRawRank ? await hydratePerson(myRawRank) : null;
  }

  const ActiveIcon = activeCategory.icon;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <CityPulseRefresh cityId={profile?.city_id} />
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться в город"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/places"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Репутация города
          </small>
          <h1 className="mt-0.5 text-sm font-black">Рейтинги</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <Trophy className="size-4.5" />
        </span>
      </header>

      {!profile?.city_id ? (
        <section className="mt-10 rounded-[1.7rem] border border-[#d9c5f3] bg-gradient-to-br from-[#fffaff] to-[#f2ecff] p-6 text-center shadow-[0_12px_30px_rgba(69,43,94,.07)]">
          <MapPin className="mx-auto size-8 text-[#8753e6]" />
          <h2 className="mt-4 text-2xl font-black tracking-[-0.06em]">
            Сначала выбери город
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#756a7d]">
            Здесь будет видно, кто создаёт движение, растёт и собирает своих рядом с
            тобой.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-3 text-sm font-black text-white"
            href="/onboarding"
          >
            <MapPin className="size-4" /> Выбрать город
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#342556] via-[#57407e] to-[#816ede] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
            <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
              <MapPin className="size-3.5" /> {cityName ?? "Твой город"}
            </span>
            <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
              Кто заметен
              <br />
              сейчас.
            </h2>
            <p className="max-w-68 mt-3 text-[11px] leading-5 text-white/75">
              Не игра и не витрина: публичная репутация людей, которые создают движение
              в городе.
            </p>
            {myRank ? (
              <Link
                className="bg-white/13 hover:bg-white/18 mt-5 flex items-center gap-3 rounded-2xl p-3 backdrop-blur transition"
                href={`/u/${myRank.username}` as Route}
              >
                <span className="grid size-9 place-items-center rounded-xl bg-white/15 text-sm font-black">
                  #{myRank.rank}
                </span>
                <span className="min-w-0 grow">
                  <small className="text-white/62 block text-[9px] font-black uppercase tracking-[0.09em]">
                    Твоя позиция
                  </small>
                  <b className="mt-0.5 block truncate text-[11px]">
                    {activeCategory.title}
                  </b>
                </span>
                <ChevronRight className="size-4 text-white/65" />
              </Link>
            ) : (
              <span className="text-white/78 mt-5 flex items-center gap-2 text-[10px] font-bold">
                <Flame className="size-3.5" /> Движение в этой подборке появится с
                публичной активностью
              </span>
            )}
          </section>

          <nav className="mt-5 flex gap-1 overflow-x-auto rounded-2xl bg-[#ebe5f1] p-1">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const active = category.key === activeKey;
              return (
                <Link
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-[10px] font-black transition ${
                    active
                      ? "bg-white text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]"
                      : "text-[#82758a]"
                  }`}
                  href={`/city/rankings?tab=${category.key}`}
                  key={category.key}
                >
                  <Icon className="size-3.5" /> {category.label}
                </Link>
              );
            })}
          </nav>

          <section className="border-[#2c2036]/8 mt-5 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
            <div className="flex items-start gap-3">
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-2xl ${activeCategory.tone}`}
              >
                <ActiveIcon className="size-5" />
              </span>
              <span>
                <h2 className="text-sm font-black">{activeCategory.title}</h2>
                <p className="mt-1 text-[10px] leading-4 text-[#756a7d]">
                  {activeCategory.description}
                </p>
              </span>
            </div>
          </section>

          {rankedPeople.length === 0 ? (
            <section className="mt-5 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
              <ActiveIcon className="mx-auto size-7 text-[#8753e6]" />
              <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
                Подборка собирается
              </h2>
              <p className="mt-2 text-xs leading-5 text-[#756a7d]">
                Здесь появятся только реальные публичные действия жителей{" "}
                {cityName ?? "города"}.
              </p>
              <Link
                className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#8753e6]"
                href="/places"
              >
                Смотреть, что происходит в городе <ChevronRight className="size-4" />
              </Link>
            </section>
          ) : (
            <section className="mt-5">
              <div className="mb-3 flex items-end justify-between">
                <span>
                  <h2 className="text-sm font-black">Сейчас в подборке</h2>
                  <p className="mt-0.5 text-[10px] text-[#82758a]">
                    Позиция меняется вслед за публичной активностью
                  </p>
                </span>
                <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
                  {rankedPeople.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {rankedPeople.map((person) => (
                  <Link
                    className="border-[#2c2036]/9 group flex items-center gap-3 rounded-[1.45rem] border bg-white p-3 shadow-[0_8px_22px_rgba(69,43,94,.05)] transition hover:-translate-y-0.5 hover:shadow-[0_13px_28px_rgba(69,43,94,.1)]"
                    href={`/u/${person.username}` as Route}
                    key={person.profile_id}
                  >
                    <PositionMark rank={person.rank} />
                    <PersonAvatar person={person} />
                    <span className="min-w-0 grow">
                      <span className="flex min-w-0 items-center gap-2">
                        <b className="truncate text-xs">{person.display_name}</b>
                        {person.profile_id === user.id && (
                          <span className="shrink-0 rounded-full bg-[#f0eaff] px-1.5 py-0.5 text-[8px] font-black text-[#7549d0]">
                            Ты
                          </span>
                        )}
                      </span>
                      <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-[#796d80]">
                        {person.roleCode ? (
                          <LocalRoleIcon
                            className="size-3.5 shrink-0 text-[#8753e6]"
                            code={person.roleCode}
                          />
                        ) : (
                          <ActiveIcon className="size-3.5 shrink-0 text-[#8753e6]" />
                        )}
                        <span className="truncate">{person.identity}</span>
                      </span>
                      <small className="mt-1 block truncate text-[9px] font-bold text-[#a094a7]">
                        {activeCategory.rowCopy}
                      </small>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-[#a295a8] transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
            <p className="text-[10px] leading-4">
              Место в рейтинге нельзя купить. Бонусы и продвижение не добавляют позицию
              напрямую: здесь учитывается только публичная жизнь в выбранной категории.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
