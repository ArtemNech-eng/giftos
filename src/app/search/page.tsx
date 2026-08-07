import Link from "next/link";
import type { Route } from "next";
/* eslint-disable @next/next/no-img-element -- avatar paths use short-lived signed Storage URLs */
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Compass,
  Gem,
  MapPin,
  Search as SearchIcon,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { PlaceIcon } from "@/components/place-icon";
import { WishCategoryIcon } from "@/components/wish-category-icon";
import { requireUser } from "@/lib/auth";
import { AnimatedArtifact } from "@/components/animated-artifact";
import { getSignedImageUrl } from "@/lib/media";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Поиск города",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type PersonRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  city: string | null;
  show_city?: boolean;
};
type PlaceRow = {
  id: string;
  name: string;
  description: string | null;
  icon_code: string | null;
};
type WishRow = {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  category_slug: string | null;
  estimated_cost_minor: number | null;
};
type EventRow = { id: string; title: string; starts_at: string; scope: string };
type ArtifactRow = {
  slug: string;
  title: string;
  artwork_path: string;
  rarity: "limited" | "rare" | "iconic";
  remaining_edition: number;
  total_edition: number;
};
type ResultPerson = PersonRow & { avatarUrl: string | null };

const scopes = [
  { key: "city", label: "Мой город", icon: MapPin },
  { key: "platform", label: "Вся платформа", icon: Compass },
] as const;

function match(value: string | null | undefined, query: string) {
  return (value ?? "").toLocaleLowerCase("ru-RU").includes(query);
}

function PersonAvatar({ person }: { person: ResultPerson }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] p-px">
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f8f4fc] text-[10px] font-black text-[#372c41]">
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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string }>;
}) {
  const { q: rawQuery = "", scope: rawScope = "city" } = await searchParams;
  const query = rawQuery.trim().slice(0, 80).toLocaleLowerCase("ru-RU");
  const scope = rawScope === "platform" ? "platform" : "city";
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();
  const hasCity = Boolean(profile?.city_id);

  let people: ResultPerson[] = [];
  let places: PlaceRow[] = [];
  let wishes: WishRow[] = [];
  let events: EventRow[] = [];
  let artifacts: ArtifactRow[] = [];

  if (query.length >= 2 && (scope === "platform" || hasCity)) {
    if (scope === "city" && profile?.city_id) {
      const [{ data: rawPeople }, { data: rawPlaces }, { data: rawEvents }] =
        await Promise.all([
          supabase
            .from("public_city_people")
            .select("id, username, display_name, avatar_path, city")
            .eq("city_id", profile.city_id)
            .limit(100),
          supabase
            .from("places")
            .select("id, name, description, icon_code")
            .eq("city_id", profile.city_id)
            .eq("is_active", true)
            .limit(100),
          supabase
            .from("events")
            .select("id, title, starts_at, scope")
            .eq("city_id", profile.city_id)
            .eq("is_cancelled", false)
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
            .limit(100),
        ]);
      const cityPeople = (rawPeople ?? []) as PersonRow[];
      const cityIds = cityPeople.map((person) => person.id);
      const { data: rawWishes } = cityIds.length
        ? await supabase
            .from("wishes")
            .select(
              "id, author_id, title, description, category_slug, estimated_cost_minor",
            )
            .in("author_id", cityIds)
            .eq("visibility", "public")
            .eq("is_archived", false)
            .order("created_at", { ascending: false })
            .limit(100)
        : { data: [] };
      people = await Promise.all(
        cityPeople
          .filter(
            (person) =>
              match(person.username, query) || match(person.display_name, query),
          )
          .slice(0, 12)
          .map(async (person) => ({
            ...person,
            avatarUrl: await getSignedImageUrl({
              bucket: "avatars",
              path: person.avatar_path,
            }),
          })),
      );
      places = ((rawPlaces ?? []) as PlaceRow[])
        .filter((place) => match(place.name, query) || match(place.description, query))
        .slice(0, 12);
      wishes = ((rawWishes ?? []) as WishRow[])
        .filter((wish) => match(wish.title, query) || match(wish.description, query))
        .slice(0, 12);
      events = ((rawEvents ?? []) as EventRow[])
        .filter((event) => match(event.title, query))
        .slice(0, 12);
    } else {
      const [
        { data: rawPeople },
        { data: rawPlaces },
        { data: rawWishes },
        { data: rawEvents },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_path, city, show_city")
          .eq("profile_visibility", "public")
          .eq("is_suspended", false)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("places")
          .select("id, name, description, icon_code")
          .eq("is_active", true)
          .limit(100),
        supabase
          .from("wishes")
          .select(
            "id, author_id, title, description, category_slug, estimated_cost_minor",
          )
          .eq("visibility", "public")
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("events")
          .select("id, title, starts_at, scope")
          .eq("is_cancelled", false)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(100),
      ]);
      people = await Promise.all(
        ((rawPeople ?? []) as PersonRow[])
          .filter(
            (person) =>
              match(person.username, query) ||
              match(person.display_name, query) ||
              (Boolean(person.show_city) && match(person.city, query)),
          )
          .slice(0, 12)
          .map(async (person) => ({
            ...person,
            city: person.show_city ? person.city : null,
            avatarUrl: await getSignedImageUrl({
              bucket: "avatars",
              path: person.avatar_path,
            }),
          })),
      );
      places = ((rawPlaces ?? []) as PlaceRow[])
        .filter((place) => match(place.name, query) || match(place.description, query))
        .slice(0, 12);
      wishes = ((rawWishes ?? []) as WishRow[])
        .filter((wish) => match(wish.title, query) || match(wish.description, query))
        .slice(0, 12);
      events = ((rawEvents ?? []) as EventRow[])
        .filter((event) => match(event.title, query))
        .slice(0, 12);
    }

    const { data: rawArtifacts } = await supabase
      .from("collectible_artifact_series")
      .select("slug, title, artwork_path, rarity, remaining_edition, total_edition")
      .eq("is_active", true)
      .limit(20);
    artifacts = ((rawArtifacts ?? []) as ArtifactRow[])
      .filter((artifact) => match(artifact.title, query))
      .slice(0, 10);
  }

  const total =
    people.length + places.length + wishes.length + events.length + artifacts.length;
  const quickLinks = [
    { href: "/people", label: "Люди", icon: UsersRound },
    { href: "/places", label: "Места", icon: MapPin },
    { href: "/wishes", label: "Желания", icon: Sparkles },
    { href: "/events", label: "События", icon: CalendarDays },
    { href: "/collection", label: "Коллекция", icon: Gem },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
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
            Открыть сцену
          </small>
          <h1 className="mt-0.5 text-sm font-black">Поиск</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <SearchIcon className="size-4.5" />
        </span>
      </header>

      <section className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_30px_rgba(69,43,94,.1)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8753e6]">
          {scope === "city" ? (
            <MapPin className="size-3.5" />
          ) : (
            <Compass className="size-3.5" />
          )}
          {scope === "city" ? (profile?.city ?? "Мой город") : "Вся платформа"}
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          Найди, куда зайти.
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-[#756a7d]">
          Люди, места, желания, события и артефакты — только из доступных публичных
          сцен.
        </p>
      </section>

      <nav className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-[#ebe5f1] p-1 text-center text-[10px] font-black">
        {scopes.map((item) => {
          const Icon = item.icon;
          const active = scope === item.key;
          return (
            <Link
              className={`rounded-xl px-2 py-2.5 transition ${
                active
                  ? "bg-white text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]"
                  : "text-[#82758a]"
              }`}
              href={`/search?scope=${item.key}`}
              key={item.key}
            >
              <Icon className="mr-1 inline size-3" />{" "}
              {item.key === "city" && !hasCity ? "Мой город" : item.label}
            </Link>
          );
        })}
      </nav>

      <form className="border-[#2c2036]/9 mt-4 flex items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 shadow-[0_5px_15px_rgba(69,43,94,.04)]">
        <SearchIcon className="size-4 shrink-0 text-[#8d7f96]" />
        <input name="scope" type="hidden" value={scope} />
        <input
          aria-label="Поиск"
          className="min-w-0 grow bg-transparent py-2 text-xs font-medium outline-none placeholder:text-[#a99eae]"
          defaultValue={rawQuery}
          maxLength={80}
          name="q"
          placeholder="Люди, места, желания, события…"
          type="search"
        />
        <button
          aria-label="Искать"
          className="grid size-8 place-items-center rounded-xl bg-[#f2ecfa] text-[#7549d0]"
          type="submit"
        >
          <SearchIcon className="size-3.5" />
        </button>
      </form>

      {scope === "city" && !hasCity ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <MapPin className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            Сначала выбери город
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            Тогда поиск будет собирать доступные публичные сцены рядом с тобой.
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#8753e6]"
            href="/settings"
          >
            Выбрать город <ChevronRight className="size-4" />
          </Link>
        </section>
      ) : query.length < 2 ? (
        <section className="mt-6">
          <div className="mb-3">
            <h2 className="text-sm font-black">Начни с направления</h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">
              Поиск не показывает приватные объекты и личные сообщения.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Link
                className="border-[#2c2036]/9 flex items-center gap-2 rounded-2xl border bg-white p-3 shadow-[0_6px_16px_rgba(69,43,94,.04)]"
                href={href as Route}
                key={label}
              >
                <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
                  <Icon className="size-4" />
                </span>
                <span className="text-[10px] font-black">{label}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : total === 0 ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <SearchIcon className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            Пока ничего не нашли
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            По запросу «{rawQuery}» нет доступных публичных сцен.
          </p>
        </section>
      ) : (
        <div className="mt-6 space-y-6">
          {people.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <span>
                  <h2 className="text-sm font-black">Люди</h2>
                  <p className="mt-0.5 text-[10px] text-[#82758a]">Открытые профили</p>
                </span>
                <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
                  {people.length}
                </span>
              </div>
              <div className="space-y-2">
                {people.map((person) => (
                  <Link
                    className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_16px_rgba(69,43,94,.04)]"
                    href={`/u/${person.username}` as Route}
                    key={person.id}
                  >
                    <PersonAvatar person={person} />
                    <span className="min-w-0 grow">
                      <b className="block truncate text-xs">{person.display_name}</b>
                      <small className="mt-1 block truncate text-[10px] text-[#81748a]">
                        @{person.username}
                        {scope === "platform" && person.city ? ` · ${person.city}` : ""}
                      </small>
                    </span>
                    <ChevronRight className="size-4 text-[#a295a8]" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {places.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <span>
                  <h2 className="text-sm font-black">Места</h2>
                  <p className="mt-0.5 text-[10px] text-[#82758a]">
                    Комнаты и точки притяжения
                  </p>
                </span>
                <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
                  {places.length}
                </span>
              </div>
              <div className="space-y-2">
                {places.map((place) => (
                  <Link
                    className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_16px_rgba(69,43,94,.04)]"
                    href={`/places/${place.id}` as Route}
                    key={place.id}
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
                      <PlaceIcon className="size-4.5" code={place.icon_code} />
                    </span>
                    <span className="min-w-0 grow">
                      <b className="block truncate text-xs">{place.name}</b>
                      {place.description && (
                        <small className="mt-1 block truncate text-[10px] text-[#81748a]">
                          {place.description}
                        </small>
                      )}
                    </span>
                    <ChevronRight className="size-4 text-[#a295a8]" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {wishes.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <span>
                  <h2 className="text-sm font-black">Желания</h2>
                  <p className="mt-0.5 text-[10px] text-[#82758a]">
                    Истории, которые можно продолжить
                  </p>
                </span>
                <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
                  {wishes.length}
                </span>
              </div>
              <div className="space-y-2">
                {wishes.map((wish) => (
                  <Link
                    className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_16px_rgba(69,43,94,.04)]"
                    href={`/wishes/${wish.id}` as Route}
                    key={wish.id}
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#f3e8ff] to-[#fff0f6] text-[#8753e6]">
                      <WishCategoryIcon
                        category={wish.category_slug}
                        className="size-4.5"
                      />
                    </span>
                    <span className="min-w-0 grow">
                      <b className="block truncate text-xs">{wish.title}</b>
                      <small className="mt-1 block truncate text-[10px] text-[#81748a]">
                        {wish.description ?? "Открыть историю"}
                      </small>
                    </span>
                    {wish.estimated_cost_minor && (
                      <small className="shrink-0 text-[9px] font-black text-[#9a7a52]">
                        ~ {formatRubles(wish.estimated_cost_minor)}
                      </small>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {events.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <span>
                  <h2 className="text-sm font-black">События</h2>
                  <p className="mt-0.5 text-[10px] text-[#82758a]">
                    То, что скоро произойдёт
                  </p>
                </span>
                <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
                  {events.length}
                </span>
              </div>
              <div className="space-y-2">
                {events.map((event) => (
                  <Link
                    className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_16px_rgba(69,43,94,.04)]"
                    href={`/events/${event.id}` as Route}
                    key={event.id}
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-[#eaf7f5] text-[#258b82]">
                      <CalendarDays className="size-4.5" />
                    </span>
                    <span className="min-w-0 grow">
                      <b className="block truncate text-xs">{event.title}</b>
                      <small className="mt-1 block text-[10px] text-[#81748a]">
                        {new Intl.DateTimeFormat("ru-RU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(event.starts_at))}
                      </small>
                    </span>
                    <ChevronRight className="size-4 text-[#a295a8]" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {artifacts.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <span>
                  <h2 className="text-sm font-black">Артефакты</h2>
                  <p className="mt-0.5 text-[10px] text-[#82758a]">ARTIFACTS 01</p>
                </span>
                <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
                  {artifacts.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {artifacts.map((artifact) => (
                  <Link
                    className="border-[#2c2036]/9 overflow-hidden rounded-2xl border bg-white shadow-[0_6px_16px_rgba(69,43,94,.04)]"
                    href={`/collection/${artifact.slug}` as Route}
                    key={artifact.slug}
                  >
                    <AnimatedArtifact
                      className="aspect-square w-full"
                      orbit={artifact.rarity === "iconic"}
                      rarity={artifact.rarity}
                      src={artifact.artwork_path}
                    />
                    <span className="block p-2.5">
                      <b className="block text-[10px]">{artifact.title}</b>
                      <small className="mt-1 block text-[8px] font-black text-[#8753e6]">
                        {artifact.remaining_edition} / {artifact.total_edition}
                      </small>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
