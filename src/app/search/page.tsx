import Link from "next/link";
import type { Route } from "next";
import {
  CalendarDays,
  Compass,
  MessageSquareText,
  Search as SearchIcon,
  UsersRound,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES } from "@/lib/constants";
import { formatRubles } from "@/lib/money";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Поиск", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type FundraiserResult = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category_slug: string | null;
  current_amount_minor: number;
  target_amount_minor: number;
};

type WishResult = {
  id: string;
  title: string;
  description: string | null;
  category_slug: string | null;
  estimated_cost_minor: number | null;
};

type PersonResult = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  city: string | null;
  show_city: boolean;
};

type CommentResult = {
  id: string;
  body: string;
  created_at: string;
  targetType: "fundraiser" | "wish";
  targetTitle: string;
  targetHref: string;
  authorName: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery = "" } = await searchParams;
  const query = rawQuery.trim().slice(0, 80);
  const matchedCategory = CATEGORIES.find(
    (category) =>
      category.slug === query.toLowerCase() ||
      category.label.toLowerCase() === query.toLowerCase(),
  );

  let fundraisers: FundraiserResult[] = [];
  let wishes: WishResult[] = [];
  let people: PersonResult[] = [];
  let interestPeople: PersonResult[] = [];
  let comments: CommentResult[] = [];
  let events: Array<{ id: string; title: string; starts_at: string; scope: string }> =
    [];

  if (hasSupabaseEnvironment() && query.length >= 2) {
    const supabase = await createClient();
    const fundraiserQuery = supabase
      .from("fundraisers")
      .select(
        "id, slug, title, description, category_slug, current_amount_minor, target_amount_minor",
      )
      .eq("visibility", "public")
      .in("status", ["active", "goal_reached"])
      .limit(12);
    const wishQuery = supabase
      .from("wishes")
      .select("id, title, description, category_slug, estimated_cost_minor")
      .eq("visibility", "public")
      .eq("is_archived", false)
      .limit(12);

    const [
      fundraiserResponse,
      wishResponse,
      personResponse,
      interestResponse,
      commentResponse,
      eventResponse,
    ] = await Promise.all([
      matchedCategory
        ? fundraiserQuery.eq("category_slug", matchedCategory.slug)
        : fundraiserQuery.textSearch("search_document", query, {
            config: "simple",
            type: "websearch",
          }),
      matchedCategory
        ? wishQuery.eq("category_slug", matchedCategory.slug)
        : wishQuery.textSearch("search_document", query, {
            config: "simple",
            type: "websearch",
          }),
      supabase
        .from("profiles")
        .select("id, username, display_name, bio, city, show_city")
        .eq("profile_visibility", "public")
        .eq("is_suspended", false)
        .or(
          `username.ilike.%${query}%,display_name.ilike.%${query}%,and(city.ilike.%${query}%,show_city.is.true)`,
        )
        .limit(12),
      matchedCategory
        ? supabase
            .from("profile_interests")
            .select("profile_id")
            .eq("category_slug", matchedCategory.slug)
            .limit(30)
        : Promise.resolve({ data: [] }),
      Promise.all([
        supabase
          .from("fundraiser_comments")
          .select(
            "id, body, created_at, fundraisers!inner(id, slug, title), profiles!inner(display_name)",
          )
          .ilike("body", `%${query}%`)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("wish_comments")
          .select(
            "id, body, created_at, wishes!inner(id, title), profiles!inner(display_name)",
          )
          .ilike("body", `%${query}%`)
          .order("created_at", { ascending: false })
          .limit(8),
      ]),
      supabase
        .from("events")
        .select("id, title, starts_at, scope")
        .eq("is_cancelled", false)
        .ilike("title", `%${query}%`)
        .order("starts_at", { ascending: true })
        .limit(8),
    ]);

    fundraisers = (fundraiserResponse.data ?? []) as FundraiserResult[];
    wishes = (wishResponse.data ?? []) as WishResult[];
    people = (personResponse.data ?? []) as PersonResult[];

    const interestProfileIds = (interestResponse.data ?? []).map(
      (row: { profile_id: string }) => row.profile_id,
    );
    if (interestProfileIds.length > 0) {
      const { data: interestProfiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, city, show_city")
        .eq("profile_visibility", "public")
        .eq("is_suspended", false)
        .in("id", interestProfileIds)
        .limit(12);
      interestPeople = (interestProfiles ?? []) as PersonResult[];
    }

    const [fundraiserComments, wishComments] = commentResponse;
    events = (
      (eventResponse.data ?? []) as Array<{
        id: string;
        title: string;
        starts_at: string;
        scope: string;
      }>
    ).map((event) => ({
      id: event.id,
      title: event.title,
      starts_at: event.starts_at,
      scope: event.scope,
    }));
    const rawComments: CommentResult[] = [
      ...(fundraiserComments.data ?? []).flatMap((row) => {
        const fundraiser = row.fundraisers?.[0];
        const author = row.profiles?.[0];
        return fundraiser && author
          ? [
              {
                id: row.id,
                body: row.body,
                created_at: row.created_at,
                targetType: "fundraiser" as const,
                targetTitle: fundraiser.title,
                targetHref: `/fundraisers/${fundraiser.slug}`,
                authorName: author.display_name,
              },
            ]
          : [];
      }),
      ...(wishComments.data ?? []).flatMap((row) => {
        const wish = row.wishes?.[0];
        const author = row.profiles?.[0];
        return wish && author
          ? [
              {
                id: row.id,
                body: row.body,
                created_at: row.created_at,
                targetType: "wish" as const,
                targetTitle: wish.title,
                targetHref: `/wishes/${wish.id}`,
                authorName: author.display_name,
              },
            ]
          : [];
      }),
    ];
    comments = rawComments
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 8);
  }

  const total =
    fundraisers.length +
    wishes.length +
    people.length +
    comments.length +
    events.length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">Открывайте новое</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Поиск «Хочу также»</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#826c73]">
            Ищите людей, желания, сборы и обсуждения по названию, интересу или городу.
          </p>
        </div>

        <form className="mt-7 flex gap-2" method="get">
          <label className="sr-only" htmlFor="global-search">
            Поисковый запрос
          </label>
          <div className="relative grow">
            <SearchIcon className="absolute left-3.5 top-3 size-5 text-[#9b858c]" />
            <input
              className="h-12 w-full rounded-xl border border-[#e7d8dc] bg-white pl-11 pr-3.5 text-sm outline-none transition placeholder:text-[#b3a0a6] focus:border-[#df4f7d] focus:ring-4 focus:ring-[#df4f7d]/10"
              defaultValue={query}
              id="global-search"
              maxLength={80}
              name="q"
              placeholder="Например: фотография, Москва, Настя"
              type="search"
            />
          </div>
          <button
            className="h-12 rounded-xl bg-[#df4f7d] px-5 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
            type="submit"
          >
            Найти
          </button>
        </form>

        {!hasSupabaseEnvironment() ? (
          <div className="mt-8">
            <EmptyState
              actionHref="/"
              actionLabel="К ленте"
              description="Поиск будет использовать реальные публичные данные после подключения self-hosted Supabase."
              title="Подключите данные для поиска"
            />
          </div>
        ) : query.length < 2 ? (
          <section className="mt-8 rounded-2xl bg-[#fff8f9] p-5">
            <p className="font-semibold">Попробуйте найти по интересу</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className="rounded-xl border border-[#f0e2e6] bg-white px-3 py-2 text-sm font-medium text-[#674f57] transition hover:border-[#efafc2] hover:bg-rose-50"
                href="/events"
              >
                📅 События города
              </Link>
              {CATEGORIES.slice(0, 10).map((category) => (
                <Link
                  className="rounded-xl border border-[#f0e2e6] bg-white px-3 py-2 text-sm font-medium text-[#674f57] transition hover:border-[#efafc2] hover:bg-rose-50"
                  href={`/search?q=${encodeURIComponent(category.label)}` as Route}
                  key={category.slug}
                >
                  {category.emoji} {category.label}
                </Link>
              ))}
            </div>
          </section>
        ) : total === 0 ? (
          <div className="mt-8">
            <EmptyState
              actionHref="/discover"
              actionLabel="Открыть желания"
              description={`По запросу «${query}» пока ничего не найдено. Попробуйте другое слово или одну из категорий.`}
              title="Нет совпадений"
            />
          </div>
        ) : (
          <div className="mt-9 space-y-10">
            {fundraisers.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Compass className="size-5 text-[#d34872]" />
                  <h2 className="text-xl font-bold">Сборы</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {fundraisers.map((item) => {
                    const category =
                      CATEGORIES.find((entry) => entry.slug === item.category_slug) ??
                      CATEGORIES.at(-1)!;
                    return (
                      <Link
                        className="surface rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                        href={`/fundraisers/${item.slug}` as Route}
                        key={item.id}
                      >
                        <span className="text-3xl">{category.emoji}</span>
                        <p className="mt-4 font-bold">{item.title}</p>
                        {item.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#826c73]">
                            {item.description}
                          </p>
                        )}
                        <p className="mt-4 text-sm font-semibold text-[#c53d68]">
                          {formatRubles(item.current_amount_minor)}{" "}
                          <span className="font-normal text-[#8e747c]">
                            из {formatRubles(item.target_amount_minor)}
                          </span>
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
            {wishes.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <SearchIcon className="size-5 text-[#d34872]" />
                  <h2 className="text-xl font-bold">Желания</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {wishes.map((item) => {
                    const category =
                      CATEGORIES.find((entry) => entry.slug === item.category_slug) ??
                      CATEGORIES.at(-1)!;
                    return (
                      <Link
                        className="surface rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                        href={`/wishes/${item.id}` as Route}
                        key={item.id}
                      >
                        <span className="text-3xl">{category.emoji}</span>
                        <p className="mt-4 font-bold">{item.title}</p>
                        {item.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#826c73]">
                            {item.description}
                          </p>
                        )}
                        {item.estimated_cost_minor && (
                          <p className="mt-4 text-sm font-semibold text-[#c53d68]">
                            ~ {formatRubles(item.estimated_cost_minor)}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
            {interestPeople.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <UsersRound className="size-5 text-[#d34872]" />
                  <h2 className="text-xl font-bold">
                    Люди по интересу: {matchedCategory?.label}
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {interestPeople.map((person, index) => (
                    <Link
                      className="surface flex items-center gap-3 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                      href={`/u/${person.username}` as Route}
                      key={person.id}
                    >
                      <span
                        className={`grid size-11 place-items-center rounded-xl text-lg font-bold text-white ${["bg-[#e2a9a2]", "bg-[#9fc6b6]", "bg-[#b7a1d2]"][index % 3]}`}
                      >
                        {person.display_name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold">
                          {person.display_name}
                        </span>
                        <span className="mt-1 block truncate text-sm text-[#8e747c]">
                          @{person.username}
                          {person.show_city && person.city ? ` · ${person.city}` : ""}
                        </span>
                        {person.bio && (
                          <span className="mt-2 line-clamp-2 block text-sm leading-5 text-[#725c63]">
                            {person.bio}
                          </span>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {people.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <UsersRound className="size-5 text-[#d34872]" />
                  <h2 className="text-xl font-bold">Люди</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {people.map((person, index) => (
                    <Link
                      className="surface flex items-center gap-3 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                      href={`/u/${person.username}` as Route}
                      key={person.id}
                    >
                      <span
                        className={`grid size-11 place-items-center rounded-xl text-lg font-bold text-white ${["bg-[#e2a9a2]", "bg-[#9fc6b6]", "bg-[#b7a1d2]"][index % 3]}`}
                      >
                        {person.display_name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold">
                          {person.display_name}
                        </span>
                        <span className="mt-1 block truncate text-sm text-[#8e747c]">
                          @{person.username}
                          {person.show_city && person.city ? ` · ${person.city}` : ""}
                        </span>
                        {person.bio && (
                          <span className="mt-2 line-clamp-2 block text-sm leading-5 text-[#725c63]">
                            {person.bio}
                          </span>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {comments.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquareText className="size-5 text-[#d34872]" />
                  <h2 className="text-xl font-bold">Обсуждения</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {comments.map((comment) => (
                    <Link
                      className="surface rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                      href={comment.targetHref as Route}
                      key={`${comment.targetType}-${comment.id}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#b08c97]">
                        {comment.targetType === "fundraiser" ? "Сбор" : "Желание"} ·{" "}
                        {comment.authorName}
                      </p>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#654e55]">
                        {comment.body}
                      </p>
                      <p className="mt-4 truncate text-sm font-bold text-[#bd3e66]">
                        {comment.targetTitle}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {events.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="size-5 text-[#d34872]" />
                  <h2 className="text-xl font-bold">События</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <Link
                      className="surface rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                      href={`/events/${event.id}` as Route}
                      key={event.id}
                    >
                      <span className="text-3xl">
                        {event.scope === "open" ? "🌎" : "📍"}
                      </span>
                      <p className="mt-3 font-bold">{event.title}</p>
                      <p className="mt-2 text-sm text-[#826c73]">
                        {new Intl.DateTimeFormat("ru-RU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(event.starts_at))}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </>
  );
}
