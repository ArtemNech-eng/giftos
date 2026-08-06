import Link from "next/link";
import type { Metadata, Route } from "next";
/* eslint-disable @next/next/no-img-element -- city avatars use short-lived signed Storage URLs */
import {
  ArrowDownRight,
  ArrowRight,
  CirclePlay,
  Heart,
  MapPin,
  MessageCircle,
  Radio,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { APP_NAME } from "@/lib/constants";
import { getSignedImageUrl } from "@/lib/media";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; invite?: string }>;
}): Promise<Metadata> {
  const { city: rawCity, invite } = await searchParams;
  const citySlug = normalizeCitySlug(rawCity);
  const isInvite = Boolean(invite && citySlug);
  const fallback: Metadata = {
    title: "Хочу также — желания ведут к людям",
    description:
      "Социальная платформа желаний, людей, мест и эфиров. Открываем Будённовск вместе.",
  };
  if (!isInvite) return fallback;

  let cityName =
    rawCity?.replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase()) ??
    "город";
  let initials: string[] = [];
  if (hasSupabaseEnvironment()) {
    try {
      const supabase = await createClient();
      const { data: city } = await supabase
        .from("cities")
        .select("id, name")
        .eq("normalized_name", citySlug)
        .eq("is_active", true)
        .maybeSingle();
      if (city) {
        cityName = city.name;
        const { data: members } = await supabase
          .from("public_city_people")
          .select("display_name")
          .eq("city_id", city.id)
          .limit(4);
        initials = (members ?? []).map((member) =>
          member.display_name.slice(0, 1).toUpperCase(),
        );
      }
    } catch {
      // A city-specific share card still works without a configured data service.
    }
  }

  const title = `Тебя приглашают в ${cityName}`;
  const subtitle = "Приглашение в город · +200 ⭐ за активного приглашённого";
  const imageParams = new URLSearchParams({
    type: "invite",
    title,
    subtitle,
  });
  if (initials.length > 0) imageParams.set("people", initials.join(","));
  return {
    title,
    description: subtitle,
    robots: { index: false, follow: false },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title,
      description: subtitle,
      images: [{ url: `/og?${imageParams.toString()}`, width: 1200, height: 630 }],
    },
  };
}

export const dynamic = "force-dynamic";

type CreatorPreview = {
  username: string;
  display_name: string;
  creator_headline: string | null;
};

type LiveRoomPreview = {
  id: string;
  slug: string;
  title: string;
  hostName: string;
  viewers: number;
};

type CityMemberPreview = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isCreator: boolean;
};

type CityLaunchPhase = "prelaunch" | "gathering" | "active";

function normalizeCitySlug(value: string | undefined) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/-/g, " ")
    .replace(/ё/g, "е");
}

function peopleLabel(count: number) {
  const remainder = count % 100;
  if (remainder >= 11 && remainder <= 14) return "человек";
  const last = count % 10;
  if (last === 1) return "человек";
  if (last >= 2 && last <= 4) return "человека";
  return "человек";
}

const creatorColors = [
  "from-[#ff4f87] via-[#ff7b5c] to-[#ffd36a]",
  "from-[#7d55ff] via-[#d65dff] to-[#ff88bf]",
  "from-[#18c4bf] via-[#4d9eff] to-[#9667ff]",
  "from-[#ffc14f] via-[#ff7277] to-[#da55ff]",
];

export default async function SeoLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; invite?: string }>;
}) {
  const { city: rawCity, invite: rawInvite } = await searchParams;
  const requestedCity = normalizeCitySlug(rawCity);
  const inviteCode = /^[a-z0-9_-]{3,40}$/i.test(rawInvite ?? "")
    ? rawInvite!.toLowerCase()
    : null;
  const inviteCityParam = rawCity?.trim() || "";
  const signInHref: Route = (
    inviteCode
      ? `/auth/sign-in?ref=${encodeURIComponent(inviteCode)}${
          inviteCityParam ? `&city=${encodeURIComponent(inviteCityParam)}` : ""
        }`
      : "/auth/sign-in"
  ) as Route;
  let creators: CreatorPreview[] = [];
  let liveRooms: LiveRoomPreview[] = [];
  let launchCityName = "Будённовск";
  let launchCityMembers: CityMemberPreview[] = [];
  let launchCityPeopleCount = 0;
  let launchCityPhase: CityLaunchPhase = "prelaunch";

  if (hasSupabaseEnvironment()) {
    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (user) redirect("/feed");
  }

  if (hasSupabaseEnvironment()) {
    try {
      const supabase = await createClient();
      const [{ data: creatorData }, { data: roomData }, { data: launchCity }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("username, display_name, creator_headline")
            .eq("is_creator", true)
            .eq("profile_visibility", "public")
            .eq("is_suspended", false)
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("live_rooms")
            .select("id, slug, title, host_id")
            .eq("status", "live")
            .eq("visibility", "public")
            .order("started_at", { ascending: false })
            .limit(3),
          supabase
            .from("cities")
            .select("id, name")
            .eq("normalized_name", requestedCity || "буденновск")
            .eq("is_active", true)
            .maybeSingle(),
        ]);
      creators = (creatorData ?? []) as CreatorPreview[];
      if (launchCity) {
        launchCityName = launchCity.name;
        const [
          { data: rawCityMembers },
          { count: cityPeopleCount },
          { count: communityPlaceCount },
          { count: upcomingEventCount },
        ] = await Promise.all([
          supabase
            .from("public_city_people")
            .select("id, username, display_name, avatar_path, is_creator")
            .eq("city_id", launchCity.id)
            .limit(12),
          supabase
            .from("public_city_people")
            .select("id", { count: "exact", head: true })
            .eq("city_id", launchCity.id),
          supabase
            .from("places")
            .select("id", { count: "exact", head: true })
            .eq("city_id", launchCity.id)
            .neq("kind", "fixed")
            .eq("is_active", true),
          supabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .eq("city_id", launchCity.id)
            .eq("is_cancelled", false)
            .gte("starts_at", new Date().toISOString()),
        ]);
        launchCityPeopleCount = cityPeopleCount ?? 0;
        launchCityPhase =
          launchCityPeopleCount >= 20 &&
          (communityPlaceCount ?? 0) >= 3 &&
          (upcomingEventCount ?? 0) >= 2
            ? "active"
            : launchCityPeopleCount >= 2
              ? "gathering"
              : "prelaunch";
        launchCityMembers = await Promise.all(
          (rawCityMembers ?? []).map(async (member) => ({
            id: member.id,
            username: member.username,
            displayName: member.display_name,
            avatarUrl: await getSignedImageUrl({
              bucket: "avatars",
              path: member.avatar_path,
            }),
            isCreator: Boolean(member.is_creator),
          })),
        );
      }
      const rooms = (roomData ?? []) as Array<{
        id: string;
        slug: string;
        title: string;
        host_id: string;
      }>;

      if (rooms.length > 0) {
        const hostIds = [...new Set(rooms.map((room) => room.host_id))];
        const [{ data: hostProfiles }, { data: participants }] = await Promise.all([
          supabase.from("profiles").select("id, display_name").in("id", hostIds),
          supabase
            .from("live_room_participants")
            .select("room_id")
            .in(
              "room_id",
              rooms.map((room) => room.id),
            )
            .is("left_at", null),
        ]);
        const hostById = new Map(
          (hostProfiles ?? []).map((profile) => [profile.id, profile]),
        );
        const viewerCount = new Map<string, number>();
        for (const participant of participants ?? []) {
          viewerCount.set(
            participant.room_id,
            (viewerCount.get(participant.room_id) ?? 0) + 1,
          );
        }
        liveRooms = rooms.flatMap((room) => {
          const host = hostById.get(room.host_id);
          return host
            ? [
                {
                  id: room.id,
                  slug: room.slug,
                  title: room.title,
                  hostName: host.display_name,
                  viewers: viewerCount.get(room.id) ?? 1,
                },
              ]
            : [];
        });
      }
    } catch {
      creators = [];
      liveRooms = [];
    }
  }

  const cityLaunchCopy = {
    prelaunch: {
      eyebrow: `${launchCityName} · первая волна`,
      title: "Открываем город, а не изображаем толпу.",
      description: `Город ещё не наполнен. Поэтому мы не рисуем чужие сторис, не ставим липовые счётчики и не зовём тебя быть «первым в пустоте». Мы собираем стартовый круг людей, которым важно сделать ${launchCityName} живым.`,
      button: "Стать частью первой волны",
    },
    gathering: {
      eyebrow: `${launchCityName} · уже собирается`,
      title: `${launchCityName} уже собирается.`,
      description: `Здесь уже появились реальные люди. Мы продолжаем собирать жителей, авторов и первые поводы встретиться — без искусственного шума.`,
      button: "Войти в круг города",
    },
    active: {
      eyebrow: `${launchCityName} · сейчас`,
      title: `${launchCityName} сейчас.`,
      description: `Люди, места и события уже дают городу ритм. Заходи посмотреть, кто рядом и куда пойти сегодня.`,
      button: "Открыть город",
    },
  }[launchCityPhase];

  return (
    <main className="landing-light relative isolate overflow-hidden bg-[#f7f3fa] text-[#201827] selection:bg-[#fc4e91] selection:text-white">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: APP_NAME,
            description:
              "Социальная платформа желаний, людей, мест и авторских историй.",
            url: process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru",
          }),
        }}
        type="application/ld+json"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-72 -top-72 size-[48rem] rounded-full bg-[#d8bcff]/75 blur-[120px]" />
        <div className="absolute right-[-18rem] top-20 size-[43rem] rounded-full bg-[#ffc0d8]/70 blur-[135px]" />
        <div className="absolute left-[25%] top-[65rem] size-[40rem] rounded-full bg-[#b8e7ee]/55 blur-[150px]" />
        <div className="landing-light-noise absolute inset-0 opacity-30" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <Link
          aria-label="Хочу также — главная"
          className="group flex items-center gap-2.5"
          href="/"
        >
          <span className="relative grid size-10 place-items-center overflow-hidden rounded-[14px] bg-[#201827] text-xl font-black text-white shadow-[0_12px_26px_rgba(56,30,79,0.16)] transition-transform duration-300 group-hover:-rotate-6">
            <span className="relative z-10">Х</span>
            <span className="absolute -bottom-3 -right-2 size-7 rounded-full bg-[#fc4e91]" />
          </span>
          <span className="text-[17px] font-black tracking-[-0.06em] sm:text-lg">
            {APP_NAME}
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 text-sm font-bold text-[#574c61] md:flex"
          aria-label="Основная навигация"
        >
          <a className="transition hover:text-[#201827]" href="#inside">
            Зачем здесь быть
          </a>
          <a className="transition hover:text-[#201827]" href="#budennovsk">
            Будённовск
          </a>
          <a className="transition hover:text-[#201827]" href="#first-wave">
            Первая волна
          </a>
          <Link
            className="rounded-full bg-[#f0e5ff] px-3 py-1.5 text-[#7549d0] transition hover:bg-[#e6d4ff]"
            href="/preview"
          >
            Посмотреть кабинет
          </Link>
        </nav>

        <Link
          className="rounded-full border border-[#201827]/15 bg-white/55 px-4 py-2 text-sm font-black text-[#201827] shadow-sm transition hover:-translate-y-0.5 hover:border-[#201827]/30 hover:bg-[#201827] hover:text-white sm:px-5"
          href={signInHref}
        >
          Войти
        </Link>
      </header>

      <section className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-20 pt-10 sm:px-8 lg:min-h-[710px] lg:grid-cols-[minmax(0,1.06fr)_minmax(420px,0.94fr)] lg:px-12 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#7e53d8]/20 bg-white/65 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#7442d3] shadow-[0_8px_30px_rgba(115,71,205,0.08)]">
            <span className="size-1.5 rounded-full bg-[#fc4e91] shadow-[0_0_12px_#fc4e91]" />
            {inviteCode
              ? `Тебя приглашают в ${launchCityName}`
              : cityLaunchCopy.eyebrow}
          </p>
          <h1 className="mt-7 max-w-4xl text-balance text-[clamp(3.5rem,8.2vw,8.4rem)] font-black leading-[0.83] tracking-[-0.084em]">
            Не листай
            <span className="block text-[#201827]/20 [-webkit-text-stroke:1px_rgba(32,24,39,0.62)]">
              чужую жизнь.
            </span>
            <span className="block bg-gradient-to-r from-[#f94a8b] via-[#c45df1] to-[#7458dc] bg-clip-text text-transparent">
              Собери свою.
            </span>
          </h1>
          <div className="mt-8 grid max-w-2xl gap-5 sm:grid-cols-[1.1fr_0.9fr] sm:items-end">
            <p className="text-pretty text-lg leading-7 text-[#4f4558] sm:text-xl sm:leading-8">
              <b className="font-black text-[#201827]">Хочу также</b> — место, где
              желание становится поводом встретиться, рассказать о себе, найти своих и
              сделать что-то вместе.
            </p>
            <p className="border-l border-[#fc4e91] pl-4 text-sm leading-6 text-[#72677c]">
              Не ещё одна витрина. Социальная среда, которую создают люди, а не
              рекламные кабинеты.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#201827] px-6 text-sm font-black text-white shadow-[0_15px_32px_rgba(45,25,63,0.2)] transition hover:-translate-y-0.5 hover:bg-[#4b2d66] sm:px-7"
              href={signInHref}
            >
              Войти в первую волну
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              className="inline-flex h-14 items-center gap-2 rounded-full border border-[#2d2038]/10 bg-white/60 px-4 text-sm font-black text-[#62556c] shadow-[0_7px_20px_rgba(64,38,88,0.05)] transition hover:-translate-y-0.5 hover:bg-white hover:text-[#201827]"
              href="/preview"
            >
              Посмотреть кабинет <ArrowDownRight className="size-4" />
            </Link>
          </div>
        </div>

        <div
          className="relative mx-auto mt-1 w-full max-w-[330px] sm:max-w-[430px] lg:mt-0 lg:max-w-[570px]"
          aria-label="Визуальная схема платформы"
        >
          <div className="absolute -left-9 top-16 size-52 rounded-full border border-[#d34b87]/20" />
          <div className="absolute -right-12 bottom-7 size-72 rounded-full border border-[#7861e4]/20" />
          <div className="relative aspect-[0.95]">
            <div className="absolute inset-x-[8%] inset-y-[3%] rotate-[7deg] rounded-[3rem] border border-[#4c3e60]/10 bg-white/50 shadow-[0_40px_100px_rgba(82,52,106,0.17)] backdrop-blur-md" />
            <div className="absolute inset-x-[7%] inset-y-[6%] -rotate-[5deg] rounded-[3rem] border border-[#7350c4]/15 bg-gradient-to-br from-[#f5e7f5] to-[#e5e5ff]" />
            <div className="absolute inset-x-[13%] inset-y-[10%] overflow-hidden rounded-[2.6rem] border border-[#241b30]/10 bg-[#fffdfd] shadow-[0_35px_90px_rgba(62,37,88,0.23)]">
              <div className="absolute -right-16 -top-16 size-56 rounded-full bg-[#ff76a9]/40 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-[#8e7cff]/35 blur-3xl" />
              <div className="relative flex h-full flex-col p-6">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-[#74697c]">
                  <span>Хочу также</span>
                  <span className="rounded-full bg-[#f0e8ff] px-2 py-1 text-[8px] text-[#6e43cd]">
                    Город 01
                  </span>
                </div>
                <div className="mt-9">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d53776]">
                    из желания — в жизнь
                  </p>
                  <p className="mt-2 max-w-sm text-4xl font-black leading-[0.88] tracking-[-0.07em] text-[#221a2a]">
                    Люди не фон.
                    <br />
                    Люди — сюжет.
                  </p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3">
                  <div className="rounded-[1.35rem] border border-[#362342]/10 bg-[#201827] p-4 text-white shadow-xl">
                    <span className="grid size-8 place-items-center rounded-full bg-[#fc4e91] text-xs font-black">
                      01
                    </span>
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
                      Желание
                    </p>
                    <p className="mt-1 text-sm font-black leading-4">
                      Сказать, чего ты хочешь
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-[#645075]/10 bg-white/75 p-4 text-[#201827] shadow-[0_12px_30px_rgba(83,54,111,0.08)]">
                    <span className="grid size-8 place-items-center rounded-full bg-[#7f5cff] text-xs font-black text-white">
                      02
                    </span>
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.12em] text-[#7d7087]">
                      Люди
                    </p>
                    <p className="mt-1 text-sm font-black leading-4">
                      Найти тех, кому тоже важно
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-[1.15rem] border border-[#3b2a46]/10 bg-[#f8f3fb]/90 px-4 py-3">
                  <span className="text-xs font-black text-[#5d5166]">
                    Место · разговор · действие
                  </span>
                  <ArrowDownRight className="size-4 text-[#e44684]" />
                </div>
              </div>
            </div>
            <div className="absolute -left-4 bottom-14 flex items-center gap-3 rounded-2xl border border-white/75 bg-[#201827] px-3.5 py-3 text-white shadow-2xl">
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#ff8366] to-[#da4cff] text-xs font-black">
                ♡
              </span>
              <span>
                <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-white/45">
                  не прячься
                </span>
                <span className="block text-xs font-bold">
                  у твоего желания есть голос
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Направления платформы"
        className="relative border-y border-[#291d35]/10 bg-white/80 py-4 text-[#201827]"
      >
        <div className="landing-track flex min-w-max items-center gap-7 whitespace-nowrap text-xl font-black tracking-[-0.055em] sm:text-2xl">
          {[
            "ЖЕЛАНИЯ",
            "ЛЮДИ",
            "МЕСТА",
            "ИСТОРИИ",
            "ЭФИРЫ",
            "ПОДДЕРЖКА",
            "АВТОРЫ",
            "ЖЕЛАНИЯ",
            "ЛЮДИ",
            "МЕСТА",
            "ИСТОРИИ",
            "ЭФИРЫ",
            "ПОДДЕРЖКА",
            "АВТОРЫ",
          ].map((item, index) => (
            <span className="flex items-center gap-7" key={`${item}-${index}`}>
              {item}
              <span className="size-2.5 rounded-full bg-[#fc4e91]" />
            </span>
          ))}
        </div>
      </section>

      <section
        className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
        id="inside"
      >
        <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cb3f78]">
              Не ради шума
            </p>
            <h2 className="mt-4 max-w-md text-balance text-5xl font-black leading-[0.89] tracking-[-0.07em] sm:text-6xl">
              Здесь есть, что начать.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#605569] sm:text-xl">
            Платформа не подменяет реальную жизнь бесконечной лентой. Она даёт повод
            проявиться: с целью, интересом, эфиром, встречей или своей маленькой
            тусовкой.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <article className="group relative overflow-hidden rounded-[2rem] border border-[#2d2038]/10 bg-[#fffdfc] p-6 shadow-[0_20px_60px_rgba(79,49,103,0.08)] sm:p-8 lg:col-span-7 lg:min-h-[390px]">
            <div className="absolute -right-16 -top-12 size-72 rounded-full bg-[#ff77a9] opacity-90 transition duration-500 group-hover:scale-110" />
            <div className="absolute bottom-[-8rem] right-20 size-80 rounded-full border-[40px] border-[#7e56ff]/25" />
            <div className="relative flex h-full flex-col">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#261b31]/10 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]">
                <Heart className="size-3.5 fill-[#ff4b8a] text-[#ff4b8a]" /> Желание —
                это начало
              </span>
              <h3 className="mt-7 max-w-lg text-balance text-4xl font-black leading-[0.9] tracking-[-0.065em] sm:text-5xl">
                Скажи вслух, чего хочешь. Так тебя легче найти.
              </h3>
              <p className="mt-5 max-w-md text-base leading-7 text-[#554a5e]">
                Желание — не ценник и не отчёт. Это живая точка, вокруг которой
                появляются поддержка, диалог и похожие люди.
              </p>
              <Link
                className="mt-auto inline-flex w-fit items-center gap-2 pt-10 text-sm font-black transition group-hover:gap-3"
                href={signInHref}
              >
                Рассказать о своём <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] bg-[#201827] p-6 text-white shadow-[0_20px_60px_rgba(49,29,72,0.22)] sm:p-8 lg:col-span-5 lg:min-h-[390px]">
            <div className="absolute -bottom-20 -right-20 size-72 rounded-full bg-[#8d6dff]/45 blur-2xl" />
            <MapPin
              className="absolute right-8 top-8 size-16 text-[#ff79b0]/80"
              strokeWidth={1.2}
            />
            <div className="relative flex h-full flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#c9bfff]">
                Город — не настройка профиля
              </p>
              <h3 className="mt-5 max-w-sm text-4xl font-black leading-[0.9] tracking-[-0.065em] sm:text-5xl">
                Город — это «куда пойдём?»
              </h3>
              <p className="text-white/62 mt-5 max-w-sm text-base leading-7">
                {launchCityPhase === "active"
                  ? `Свои места, люди, разговоры и поводы встретиться — ${launchCityName} уже живёт этим ритмом.`
                  : `Свои места, люди, разговоры и поводы встретиться. Начинаем с ${launchCityName} — честно, с нуля и вместе.`}
              </p>
              <a
                className="mt-auto inline-flex w-fit items-center gap-2 pt-10 text-sm font-black text-[#f5dff0] transition hover:gap-3"
                href="#budennovsk"
              >
                Открыть первый город <ArrowDownRight className="size-4" />
              </a>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-[#2d2038]/10 bg-[#f2ebff] p-6 sm:p-8 lg:col-span-4 lg:min-h-[310px]">
            <div className="absolute -right-10 top-0 size-48 rounded-full bg-[#ffe08a]/55 blur-3xl" />
            <CirclePlay className="size-9 text-[#754be1]" strokeWidth={1.5} />
            <h3 className="mt-8 text-3xl font-black leading-[0.93] tracking-[-0.06em]">
              Покажи себя в движении.
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#5c5066]">
              Stories, посты и эфиры — чтобы не остаться аватаркой в чужом списке.
            </p>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#ff4d82] via-[#b954e9] to-[#6954eb] p-6 text-white shadow-[0_20px_45px_rgba(184,72,181,0.22)] sm:p-8 lg:col-span-4 lg:min-h-[310px]">
            <MessageCircle className="size-9 text-white/90" strokeWidth={1.5} />
            <h3 className="mt-8 text-3xl font-black leading-[0.93] tracking-[-0.06em]">
              Не набирай аудиторию. Собирай своих.
            </h3>
            <p className="text-white/83 mt-4 max-w-sm text-sm leading-6">
              Здесь реакция может стать разговором, а разговор — новой общей историей.
            </p>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-[#2d2038]/10 bg-[#dcf5f2] p-6 text-[#0d2628] sm:p-8 lg:col-span-4 lg:min-h-[310px]">
            <div className="absolute -bottom-20 -right-10 size-64 rounded-full border-[28px] border-[#36bbb3]/30" />
            <UsersRound className="size-9 text-[#158c87]" strokeWidth={1.5} />
            <h3 className="mt-8 max-w-xs text-3xl font-black leading-[0.93] tracking-[-0.06em]">
              Собери своё место на карте.
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#0d2628]/65">
              Тусовка начинается не с вывески. С пары людей, которым есть что обсудить.
            </p>
          </article>
        </div>
      </section>

      <section
        className="relative overflow-hidden border-y border-[#2f203d]/10 bg-[#eae0fa]"
        id="budennovsk"
      >
        <div
          aria-hidden="true"
          className="absolute -left-40 bottom-[-18rem] size-[38rem] rounded-full bg-[#f870a4]/35 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="absolute -right-36 -top-32 size-[31rem] rounded-full bg-[#8e70f5]/35 blur-[110px]"
        />
        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.06fr_0.94fr] lg:px-12 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#8b43d1]">
              <MapPin className="size-4" /> Город 01 · {launchCityName}
            </p>
            <h2 className="mt-6 max-w-3xl text-balance text-5xl font-black leading-[0.87] tracking-[-0.075em] sm:text-7xl">
              {cityLaunchCopy.title}
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#564a61] sm:text-xl">
              {cityLaunchCopy.description}
            </p>
            <Link
              className="group mt-9 inline-flex items-center gap-3 rounded-full bg-[#201827] px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_34px_rgba(48,27,70,0.2)] transition hover:-translate-y-0.5 hover:bg-[#4b2d66]"
              href={signInHref}
            >
              {cityLaunchCopy.button}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                number: "01",
                title: "Заявить о себе",
                text: "Профиль, желание, интересы — без необходимости играть чужую роль.",
              },
              {
                number: "02",
                title: "Собрать своих",
                text: "Авторы, организаторы, инициативные жители и те, кто просто хочет общения.",
              },
              {
                number: "03",
                title: "Запустить ритм",
                text: "Свои места, первые события, stories и эфиры — когда появляются реальные люди.",
              },
            ].map((step) => (
              <div
                className="group flex gap-5 rounded-[1.6rem] border border-white/65 bg-white/55 p-5 shadow-[0_12px_30px_rgba(76,44,110,0.08)] transition hover:-translate-y-0.5 hover:bg-white/75 sm:block lg:flex"
                key={step.number}
              >
                <span className="shrink-0 text-4xl font-black leading-none tracking-[-0.08em] text-[#e34f8a] sm:block lg:text-5xl">
                  {step.number}
                </span>
                <div className="sm:mt-6 lg:mt-0">
                  <h3 className="text-lg font-black tracking-[-0.03em]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#665a70]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {launchCityMembers.length > 0 && (
        <section className="relative overflow-hidden border-y border-[#2e203a]/10 bg-white/70">
          <div
            aria-hidden="true"
            className="absolute -right-36 top-[-16rem] size-[34rem] rounded-full bg-[#ffc3dc]/65 blur-[120px]"
          />
          <div className="relative mx-auto grid max-w-[1440px] gap-9 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-12 lg:py-24">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cb3f78]">
                Уже в круге {launchCityName}
              </p>
              <h2 className="mt-4 max-w-xl text-balance text-4xl font-black leading-[0.88] tracking-[-0.07em] sm:text-5xl">
                Здесь уже есть с кем начать.
              </h2>
              <p className="mt-5 max-w-md text-lg leading-7 text-[#685c71]">
                {launchCityPeopleCount} {peopleLabel(launchCityPeopleCount)} с публичным
                профилем уже в {launchCityName}. Это не витрина — это люди, которых
                можно увидеть и узнать.
              </p>
              <Link
                className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#201827] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#4b2d66]"
                href={signInHref}
              >
                Присоединиться к своим
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="rounded-[2rem] border border-[#2b2035]/10 bg-[#fffdfd]/90 p-4 shadow-[0_22px_60px_rgba(74,44,102,0.11)] sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-[#2d2039]/10 pb-4">
                <span className="inline-flex items-center gap-2 text-sm font-black">
                  <span className="size-2.5 rounded-full bg-[#45c69d] shadow-[0_0_0_4px_rgba(69,198,157,0.15)]" />
                  Люди города
                </span>
                <span className="rounded-full bg-[#f3eaff] px-3 py-1.5 text-xs font-black text-[#7442d3]">
                  {launchCityPeopleCount} в круге
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
                {launchCityMembers.map((member, index) => (
                  <Link
                    className="group flex min-w-0 flex-col items-center text-center"
                    href={`/u/${member.username}`}
                    key={member.id}
                  >
                    <span
                      className={`relative grid size-16 place-items-center overflow-hidden rounded-full bg-gradient-to-br p-0.5 text-lg font-black text-white shadow-[0_10px_22px_rgba(86,52,111,0.16)] transition duration-300 group-hover:-translate-y-1 ${creatorColors[index % creatorColors.length]}`}
                    >
                      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#ede5f4] text-[#36293f]">
                        {member.avatarUrl ? (
                          <img
                            alt={`Аватар ${member.displayName}`}
                            className="size-full object-cover"
                            src={member.avatarUrl}
                          />
                        ) : (
                          member.displayName.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      {member.isCreator && (
                        <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white bg-[#201827] text-[9px] text-white">
                          ✦
                        </span>
                      )}
                    </span>
                    <span className="mt-2 w-full truncate text-xs font-black text-[#382d41]">
                      {member.displayName}
                    </span>
                  </Link>
                ))}
              </div>
              <p className="mt-6 rounded-xl bg-[#f7f1fa] px-4 py-3 text-center text-xs leading-5 text-[#73677c]">
                Круглые аватары — публичные жители {launchCityName}. Новые жители
                появляются здесь сразу после создания открытого профиля.
              </p>
            </div>
          </div>
        </section>
      )}

      <section
        className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
        id="first-wave"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cb3f78]">
              Первая волна — это не очередь
            </p>
            <h2 className="mt-4 text-balance text-5xl font-black leading-[0.88] tracking-[-0.075em] sm:text-6xl">
              Не будь первым в пустоте. Будь одним из первых.
            </h2>
          </div>
          <p className="max-w-md text-lg leading-7 text-[#6a5e73]">
            У каждого свой вход в город. Выбери, с чего хочешь начать — дальше платформа
            сведёт желание с людьми и действиями.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              number: "01",
              icon: UsersRound,
              color: "bg-[#f4e8ff] text-[#6e43cd]",
              title: "Найти своих",
              text: "Заявить интересы, увидеть похожих людей и не раствориться в общей ленте.",
            },
            {
              number: "02",
              icon: CirclePlay,
              color: "bg-[#ffe4ef] text-[#df3d7b]",
              title: "Показать себя",
              text: "Создать страницу, рассказать о желании, выпускать stories и собирать вокруг себя аудиторию.",
            },
            {
              number: "03",
              icon: MapPin,
              color: "bg-[#dff4f0] text-[#188c86]",
              title: "Запустить повод",
              text: "Открыть своё место, собрать небольшую тусовку или дать идею первому событию.",
            },
          ].map(({ number, icon: Icon, color, title, text }) => (
            <article
              className="group relative overflow-hidden rounded-[1.85rem] border border-[#2c1f37]/10 bg-white/75 p-6 shadow-[0_14px_38px_rgba(73,43,101,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#8b62dc]/35 hover:shadow-[0_24px_52px_rgba(73,43,101,0.14)] sm:p-7"
              key={number}
            >
              <span className="absolute right-6 top-5 text-5xl font-black tracking-[-0.1em] text-[#2c1f37]/[0.06]">
                {number}
              </span>
              <span className={`grid size-12 place-items-center rounded-2xl ${color}`}>
                <Icon className="size-6" strokeWidth={1.8} />
              </span>
              <h3 className="mt-10 text-2xl font-black tracking-[-0.055em]">{title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#685c71]">{text}</p>
              <span className="mt-8 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#7b52cf] transition group-hover:gap-2.5">
                Твой маршрут <ArrowRight className="size-3.5" />
              </span>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-[1.6rem] border border-[#24182f]/10 bg-[#201827] px-6 py-5 text-white shadow-[0_18px_44px_rgba(43,25,61,0.18)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-white/68 max-w-2xl text-sm leading-6">
            {launchCityPhase === "active"
              ? "Город уже живёт за счёт настоящих людей, мест и поводов встретиться — без накруток и декораций."
              : "Никаких обещаний «города, который уже кипит». Сначала — честный круг людей, потом места, истории и ритм, который они создают сами."}
          </p>
          <Link
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#201827] transition hover:bg-[#ffdce9]"
            href={signInHref}
          >
            Войти в круг
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {(creators.length > 0 || liveRooms.length > 0) && (
        <section
          className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-28"
          id="voices"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cb3f78]">
                Настоящие люди
              </p>
              <h2 className="mt-4 text-balance text-4xl font-black leading-[0.9] tracking-[-0.065em] sm:text-5xl">
                Первые голоса уже звучат.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#70647b]">
              Этот блок появляется только из открытых профилей и активных эфиров
              платформы.
            </p>
          </div>

          {creators.length > 0 && (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((creator, index) => (
                <Link
                  className="group relative overflow-hidden rounded-[1.65rem] border border-[#2b2035]/10 bg-white/80 p-5 shadow-[0_12px_35px_rgba(78,48,106,0.08)] transition hover:-translate-y-1 hover:border-[#7d50d0]/35 hover:shadow-[0_22px_45px_rgba(78,48,106,0.16)]"
                  href={`/u/${creator.username}`}
                  key={creator.username}
                >
                  <div
                    className={`absolute -right-8 -top-10 size-32 rounded-full bg-gradient-to-br opacity-55 blur-2xl ${creatorColors[index % creatorColors.length]}`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span
                      className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-lg font-black text-white ${creatorColors[index % creatorColors.length]}`}
                    >
                      {creator.display_name.slice(0, 1).toUpperCase()}
                    </span>
                    <ArrowDownRight className="size-5 text-[#695e73] transition-transform group-hover:translate-x-1 group-hover:translate-y-1 group-hover:text-[#201827]" />
                  </div>
                  <div className="relative mt-8">
                    <p className="text-xl font-black tracking-[-0.04em]">
                      {creator.display_name}
                    </p>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#685d72]">
                      {creator.creator_headline ?? "Автор в «Хочу также»"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {liveRooms.length > 0 && (
            <div className="mt-12">
              <div className="mb-5 flex items-center gap-2 text-sm font-black">
                <Radio className="size-4 text-[#e74782]" /> Сейчас в эфире
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {liveRooms.map((room) => (
                  <Link
                    className="group rounded-[1.5rem] bg-[#201827] p-5 text-white shadow-[0_18px_40px_rgba(41,23,59,0.2)] transition hover:-translate-y-0.5 hover:bg-[#34253f]"
                    href={`/live/${room.slug}`}
                    key={room.id}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff315c] px-2.5 py-1 text-[10px] font-black tracking-[0.12em]">
                      <span className="size-1.5 animate-pulse rounded-full bg-white" />{" "}
                      LIVE
                    </span>
                    <p className="mt-9 truncate text-lg font-black tracking-[-0.035em]">
                      {room.title}
                    </p>
                    <p className="mt-2 flex items-center justify-between text-sm text-white/55">
                      <span className="truncate">{room.hostName}</span>
                      <span className="ml-3 inline-flex shrink-0 items-center gap-1.5">
                        <UsersRound className="size-4" /> {room.viewers}
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="relative overflow-hidden border-t border-[#2d2038]/10 bg-[#201827] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28">
        <div
          aria-hidden="true"
          className="absolute -right-28 -top-48 size-[34rem] rounded-full bg-[#ff6c9b]/45 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-64 left-[38%] size-[38rem] rounded-full bg-[#735bff]/35 blur-3xl"
        />
        <div className="relative mx-auto max-w-[1100px] text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb6d0]">
            Это только начинается
          </p>
          <h2 className="mt-6 text-balance text-[clamp(3.4rem,8vw,7.3rem)] font-black leading-[0.82] tracking-[-0.09em]">
            Твоё «хочу»
            <span className="block text-[#ff86b2]">может стать общим.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-white/65 sm:text-xl">
            Войди в первую волну «Хочу также» и помоги открыть первый живой город — без
            декораций, по-настоящему.
          </p>
          <Link
            className="group mt-10 inline-flex h-14 items-center gap-3 rounded-full bg-white px-7 text-sm font-black text-[#201827] transition hover:-translate-y-0.5 hover:bg-[#ffdce9]"
            href={signInHref}
          >
            Присоединиться к первой волне
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer className="bg-[#15101a] px-5 py-8 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 text-xs font-bold text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a className="transition hover:text-white" href="#inside">
              Платформа
            </a>
            <a className="transition hover:text-white" href="#budennovsk">
              Первый город
            </a>
            <Link className="transition hover:text-white" href={signInHref}>
              Войти
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
