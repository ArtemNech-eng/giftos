import Link from "next/link";
import type { Route } from "next";
import { Compass, Search as SearchIcon, UsersRound } from "lucide-react";

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

    const [fundraiserResponse, wishResponse, personResponse] = await Promise.all([
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
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(12),
    ]);

    fundraisers = (fundraiserResponse.data ?? []) as FundraiserResult[];
    wishes = (wishResponse.data ?? []) as WishResult[];
    people = (personResponse.data ?? []) as PersonResult[];
  }

  const total = fundraisers.length + wishes.length + people.length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">Открывайте новое</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Поиск «Хочу также»</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#826c73]">
            Ищите людей, публичные желания и сборы по названию или категории.
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
              placeholder="Например: фотография, Настя, Япония"
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
          </div>
        )}
      </main>
    </>
  );
}
