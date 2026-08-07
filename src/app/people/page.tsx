import Link from "next/link";
import type { Route } from "next";
/* eslint-disable @next/next/no-img-element -- avatar paths use short-lived signed Storage URLs */
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Compass,
  MapPin,
  MessageCircle,
  Radio,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { CityPulseRefresh } from "@/components/city-pulse-refresh";
import { LocalRoleIcon } from "@/components/local-role-icon";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";

export const metadata = {
  title: "Люди города",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type CityPersonRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  city: string | null;
  city_id: string | null;
  is_creator: boolean;
  followers: number;
};
type PlatformPersonRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  city: string | null;
  city_id: string | null;
  show_city: boolean;
  is_creator: boolean;
};
type LocalCreatorRow = {
  id: string;
  role_code: string;
  city_label: string | null;
  headline: string | null;
  live_slug: string | null;
  live_title: string | null;
  story_id: string | null;
  event_id: string | null;
  event_title: string | null;
};
type PulseRow = {
  kind: "presence" | "place_message" | "live" | "event" | "ambassador";
  actor_id: string;
  target_id: string;
  target_name: string;
  target_slug: string | null;
  created_at: string;
};
type SceneContext = {
  kind: "live" | "story" | "event" | "presence" | "message";
  label: string;
  href: Route;
};
type DirectoryPerson = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  cityName: string | null;
  isCreator: boolean;
  followers: number;
  following: boolean;
  roleCode: string | null;
  identity: string;
  context: SceneContext | null;
};

const FILTERS = [
  { key: "all", label: "Все", icon: UsersRound },
  { key: "now", label: "Сейчас", icon: Radio },
  { key: "creators", label: "Создают", icon: Sparkles },
] as const;

type DirectoryFilter = (typeof FILTERS)[number]["key"];

function contextPriority(context: SceneContext | null) {
  if (!context) return 0;
  if (context.kind === "live") return 5;
  if (context.kind === "presence") return 4;
  if (context.kind === "message") return 3;
  if (context.kind === "story") return 2;
  return 1;
}

function contextFromCreator(creator: LocalCreatorRow | undefined): SceneContext | null {
  if (!creator) return null;
  if (creator.live_slug)
    return {
      kind: "live",
      label: creator.live_title ? `В эфире: ${creator.live_title}` : "Сейчас в эфире",
      href: `/live/${creator.live_slug}` as Route,
    };
  if (creator.story_id)
    return {
      kind: "story",
      label: "Показывает новую story",
      href: `/stories/${creator.story_id}` as Route,
    };
  if (creator.event_id)
    return {
      kind: "event",
      label: creator.event_title
        ? `Событие: ${creator.event_title}`
        : "Собирает событие",
      href: `/events/${creator.event_id}` as Route,
    };
  return null;
}

function contextFromPulse(item: PulseRow): SceneContext | null {
  if (item.kind === "live")
    return {
      kind: "live",
      label: `В эфире: ${item.target_name}`,
      href: item.target_slug
        ? (`/live/${item.target_slug}` as Route)
        : ("/feed" as Route),
    };
  if (item.kind === "presence")
    return {
      kind: "presence",
      label: `Сейчас в «${item.target_name}»`,
      href: `/places/${item.target_id}` as Route,
    };
  if (item.kind === "place_message")
    return {
      kind: "message",
      label: `Общается в «${item.target_name}»`,
      href: `/places/${item.target_id}` as Route,
    };
  if (item.kind === "event")
    return {
      kind: "event",
      label: `Собирает «${item.target_name}»`,
      href: `/events/${item.target_id}` as Route,
    };
  return null;
}

function ContextIcon({ context }: { context: SceneContext }) {
  if (context.kind === "live") return <Radio className="size-3.5" />;
  if (context.kind === "story") return <Sparkles className="size-3.5" />;
  if (context.kind === "event") return <CalendarDays className="size-3.5" />;
  if (context.kind === "message") return <MessageCircle className="size-3.5" />;
  return <MapPin className="size-3.5" />;
}

function PersonAvatar({ person }: { person: DirectoryPerson }) {
  return (
    <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] p-0.5">
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f8f4fc] text-sm font-black text-[#372c41]">
        {person.avatarUrl ? (
          <img
            loading="lazy"
            decoding="async"
            alt=""
            className="size-full object-cover"
            src={person.avatarUrl}
          />
        ) : (
          person.displayName.slice(0, 1).toUpperCase()
        )}
      </span>
      {person.context?.kind === "live" && (
        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-[#ff4d78]" />
      )}
    </span>
  );
}

function PersonCard({
  person,
  showCity,
}: {
  person: DirectoryPerson;
  showCity: boolean;
}) {
  return (
    <article className="border-[#2c2036]/9 rounded-[1.5rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
      <Link
        className="group flex items-center gap-3"
        href={`/u/${person.username}` as Route}
      >
        <PersonAvatar person={person} />
        <span className="min-w-0 grow">
          <span className="flex min-w-0 items-center gap-2">
            <b className="truncate text-sm">{person.displayName}</b>
            {person.following && (
              <span className="shrink-0 rounded-full bg-[#f0eaff] px-1.5 py-0.5 text-[8px] font-black text-[#7549d0]">
                В твоём круге
              </span>
            )}
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-[#796d80]">
            {person.roleCode ? (
              <LocalRoleIcon
                className="size-3.5 shrink-0 text-[#8753e6]"
                code={person.roleCode}
              />
            ) : person.isCreator ? (
              <Sparkles className="size-3.5 shrink-0 text-[#8753e6]" />
            ) : (
              <UsersRound className="size-3.5 shrink-0 text-[#8753e6]" />
            )}
            <span className="truncate">{person.identity}</span>
          </span>
          {showCity && person.cityName && (
            <small className="mt-1 flex items-center gap-1 text-[9px] font-bold text-[#9a8da1]">
              <MapPin className="size-3" /> {person.cityName}
            </small>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-[#a295a8] transition group-hover:translate-x-0.5" />
      </Link>
      {person.context && (
        <Link
          className="mt-3 flex items-center gap-2 rounded-xl bg-[#faf7fc] px-3 py-2 text-[10px] font-bold text-[#6d5c7a] transition hover:bg-[#f2ebfa]"
          href={person.context.href}
        >
          <span className="grid size-6 place-items-center rounded-lg bg-[#f0e9ff] text-[#8753e6]">
            <ContextIcon context={person.context} />
          </span>
          <span className="min-w-0 grow truncate">{person.context.label}</span>
          <ChevronRight className="size-3.5 shrink-0 text-[#a295a8]" />
        </Link>
      )}
    </article>
  );
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; filter?: string; q?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const {
    scope: rawScope = "city",
    filter: rawFilter = "all",
    q: rawQuery = "",
  } = await searchParams;
  const scope = rawScope === "platform" ? "platform" : "city";
  const filter = FILTERS.some((item) => item.key === rawFilter)
    ? (rawFilter as DirectoryFilter)
    : "all";
  const query = rawQuery.trim().slice(0, 60);

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();
  const hasCity = Boolean(profile?.city_id);

  let rawPeople: CityPersonRow[] = [];
  if (scope === "city" && profile?.city_id) {
    const { data } = await supabase
      .from("public_city_people")
      .select(
        "id, username, display_name, avatar_path, city, city_id, is_creator, followers",
      )
      .eq("city_id", profile.city_id)
      .order("followers", { ascending: false })
      .limit(80);
    rawPeople = (data ?? []) as CityPersonRow[];
  } else if (scope === "platform") {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_path, city, city_id, show_city, is_creator",
      )
      .eq("profile_visibility", "public")
      .eq("is_suspended", false)
      .order("created_at", { ascending: false })
      .limit(80);
    rawPeople = ((data ?? []) as PlatformPersonRow[]).map((person) => ({
      id: person.id,
      username: person.username,
      display_name: person.display_name,
      avatar_path: person.avatar_path,
      city: person.show_city ? person.city : null,
      city_id: person.city_id,
      is_creator: person.is_creator,
      followers: 0,
    }));
  }

  const people = rawPeople.filter((person) => person.id !== user.id);
  const personIds = people.map((person) => person.id);
  const [localResult, followsResult, pulseResult] = await Promise.all([
    personIds.length > 0
      ? supabase
          .from("public_local_creators")
          .select(
            "id, role_code, city_label, headline, live_slug, live_title, story_id, event_id, event_title",
          )
          .in("id", personIds)
      : Promise.resolve({ data: [] as LocalCreatorRow[] }),
    personIds.length > 0
      ? supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", personIds)
      : Promise.resolve({ data: [] as Array<{ following_id: string }> }),
    scope === "city" && profile?.city_id
      ? supabase
          .from("public_city_pulse")
          .select("kind, actor_id, target_id, target_name, target_slug, created_at")
          .eq("city_id", profile.city_id)
          .order("created_at", { ascending: false })
          .limit(80)
      : Promise.resolve({ data: [] as PulseRow[] }),
  ]);

  const creatorById = new Map(
    ((localResult.data ?? []) as LocalCreatorRow[]).map((creator) => [
      creator.id,
      creator,
    ]),
  );
  const followingIds = new Set(
    (followsResult.data ?? []).map((follow) => follow.following_id),
  );
  const pulseByActor = new Map<string, SceneContext>();
  for (const rawPulse of (pulseResult.data ?? []) as PulseRow[]) {
    if (!personIds.includes(rawPulse.actor_id)) continue;
    const context = contextFromPulse(rawPulse);
    if (!context) continue;
    const existing = pulseByActor.get(rawPulse.actor_id);
    if (!existing || contextPriority(context) > contextPriority(existing))
      pulseByActor.set(rawPulse.actor_id, context);
  }

  let directory = await Promise.all(
    people.map(async (person): Promise<DirectoryPerson> => {
      const creator = creatorById.get(person.id);
      return {
        id: person.id,
        username: person.username,
        displayName: person.display_name,
        avatarUrl: await getSignedImageUrl({
          bucket: "avatars",
          path: person.avatar_path,
        }),
        cityName: person.city,
        isCreator: person.is_creator,
        followers: person.followers,
        following: followingIds.has(person.id),
        roleCode: creator?.role_code ?? null,
        identity:
          creator?.city_label ??
          creator?.headline ??
          (person.is_creator ? "Автор города" : "Житель города"),
        context: contextFromCreator(creator) ?? pulseByActor.get(person.id) ?? null,
      };
    }),
  );

  if (filter === "now")
    directory = directory.filter(
      (person) => person.context && person.context.kind !== "event",
    );
  if (filter === "creators")
    directory = directory.filter(
      (person) => Boolean(person.roleCode) || person.isCreator,
    );
  if (query) {
    const needle = query.toLocaleLowerCase("ru-RU");
    directory = directory.filter((person) =>
      [person.displayName, person.username, person.identity, person.cityName ?? ""]
        .join(" ")
        .toLocaleLowerCase("ru-RU")
        .includes(needle),
    );
  }
  directory.sort((a, b) => {
    if (a.following !== b.following) return a.following ? -1 : 1;
    const contextDelta = contextPriority(b.context) - contextPriority(a.context);
    if (contextDelta !== 0) return contextDelta;
    return b.followers - a.followers;
  });

  const cityName = profile?.city ?? "Твой город";
  const activeFilter = FILTERS.find((item) => item.key === filter) ?? FILTERS[0];
  const ActiveFilterIcon = activeFilter.icon;
  const makeHref = (nextFilter: DirectoryFilter): Route =>
    `/people?scope=${scope}&filter=${nextFilter}${query ? `&q=${encodeURIComponent(query)}` : ""}` as Route;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <CityPulseRefresh cityId={scope === "city" ? profile?.city_id : null} />
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
            Свои люди
          </small>
          <h1 className="mt-0.5 text-sm font-black">Люди</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <UsersRound className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#322452] via-[#543d7a] to-[#7b67d8] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.2)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          {scope === "city" ? (
            <MapPin className="size-3.5" />
          ) : (
            <Compass className="size-3.5" />
          )}
          {scope === "city" ? cityName : "Вся платформа"}
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          {scope === "city" ? (
            <>
              Найди
              <br />
              своих.
            </>
          ) : (
            <>
              Новые люди,
              <br />
              новые истории.
            </>
          )}
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-white/75">
          Открывай публичные истории, эфиры, события и места — не листай людей со
          стороны.
        </p>
      </section>

      <nav className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-[#ebe5f1] p-1 text-center text-[10px] font-black">
        <Link
          className={`rounded-xl px-2 py-2.5 transition ${
            scope === "city"
              ? "bg-white text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]"
              : "text-[#82758a]"
          }`}
          href="/people?scope=city"
        >
          {hasCity ? cityName : "Мой город"}
        </Link>
        <Link
          className={`rounded-xl px-2 py-2.5 transition ${
            scope === "platform"
              ? "bg-white text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]"
              : "text-[#82758a]"
          }`}
          href="/people?scope=platform"
        >
          Вся платформа
        </Link>
      </nav>

      <form className="border-[#2c2036]/9 mt-4 flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 shadow-[0_5px_15px_rgba(69,43,94,.04)]">
        <Search className="size-4 shrink-0 text-[#8d7f96]" />
        <input name="scope" type="hidden" value={scope} />
        <input name="filter" type="hidden" value={filter} />
        <input
          aria-label="Поиск людей"
          className="min-w-0 grow bg-transparent py-2 text-xs font-medium outline-none placeholder:text-[#a99eae]"
          defaultValue={query}
          maxLength={60}
          name="q"
          placeholder="Имя, ник или чем человек живёт…"
        />
        <button
          aria-label="Искать"
          className="grid size-8 place-items-center rounded-xl bg-[#f2ecfa] text-[#7549d0]"
          type="submit"
        >
          <Search className="size-3.5" />
        </button>
      </form>

      {scope === "city" && hasCity && (
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => {
            const Icon = item.icon;
            const active = item.key === filter;
            return (
              <Link
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-black transition ${
                  active
                    ? "bg-[#7549d0] text-white shadow-[0_6px_14px_rgba(117,73,208,.2)]"
                    : "bg-white text-[#786a81] shadow-[0_4px_12px_rgba(69,43,94,.04)]"
                }`}
                href={makeHref(item.key)}
                key={item.key}
              >
                <Icon className="size-3.5" /> {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      {!hasCity && scope === "city" ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <MapPin className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            Сначала выбери город
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            Тогда здесь появятся публичные люди, локальные авторы и их городские сцены.
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2.5 text-xs font-black text-white"
            href="/onboarding"
          >
            <MapPin className="size-4" /> Выбрать город
          </Link>
        </section>
      ) : directory.length === 0 ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <ActiveFilterIcon className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            {query
              ? "Никого не нашли"
              : filter === "now"
                ? "Сейчас тихо"
                : "Люди собираются"}
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            {query
              ? `По запросу «${query}» пока нет публичных профилей.`
              : filter === "now"
                ? "Когда кто-то выйдет в эфир, покажет story или зайдёт в публичное место, он появится здесь."
                : "Здесь появятся только реальные публичные профили — без выдуманных жителей."}
          </p>
          {filter !== "all" && !query && (
            <Link
              className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#8753e6]"
              href={makeHref("all")}
            >
              Смотреть всех людей <ChevronRight className="size-4" />
            </Link>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <span>
              <h2 className="text-sm font-black">
                {filter === "now"
                  ? "Сейчас в городской сцене"
                  : filter === "creators"
                    ? "Создают в городе"
                    : scope === "city"
                      ? "Люди рядом"
                      : "Открывать людей"}
              </h2>
              <p className="mt-0.5 text-[10px] text-[#82758a]">
                {scope === "city"
                  ? "Сначала твой круг и люди с публичным контекстом"
                  : "Только публичные профили, которые открыты к просмотру"}
              </p>
            </span>
            <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
              {directory.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {directory.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                showCity={scope === "platform"}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <UsersRound className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Здесь видны только публичные люди, которые сами открыли свой город. Личные
          сообщения, скрытые профили и точная геолокация не показываются.
        </p>
      </section>
    </main>
  );
}
