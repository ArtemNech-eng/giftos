import Link from "next/link";
import type { Route } from "next";
import { Compass, Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { WishCategoryIcon } from "@/components/wish-category-icon";
import { CATEGORIES } from "@/lib/constants";
import { formatRubles } from "@/lib/money";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Открывать желания" };
export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const categoryItem = CATEGORIES.find((item) => item.slug === category);

  if (!hasSupabaseEnvironment()) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <EmptyState
            actionHref="/"
            actionLabel="К ленте"
            description="После подключения Supabase здесь появятся публичные желания и сборы по категориям."
            title="Открывайте новые желания"
          />
        </main>
      </>
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("wishes")
    .select("id, title, description, estimated_cost_minor, category_slug, created_at")
    .eq("visibility", "public")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(24);
  if (categoryItem) query = query.eq("category_slug", categoryItem.slug);
  const { data: wishes } = await query;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#bd3e66]">Вдохновляйтесь</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Желания сообщества
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#826c73]">
              Смотрите, о чём мечтают люди, и создавайте похожее желание одним нажатием.
            </p>
          </div>
          <Compass className="mb-2 hidden size-8 text-[#d34872] sm:block" />
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          <Link
            className={`rounded-xl border px-3 py-2 text-sm font-medium ${!categoryItem ? "border-[#df4f7d] bg-[#fff0f4] text-[#bd3e66]" : "border-[#f0e2e6] text-[#674f57]"}`}
            href="/discover"
          >
            Все
          </Link>
          {CATEGORIES.map((item) => (
            <Link
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition hover:border-[#efafc2] hover:bg-rose-50 ${categoryItem?.slug === item.slug ? "border-[#df4f7d] bg-[#fff0f4] text-[#bd3e66]" : "border-[#f0e2e6] text-[#674f57]"}`}
              href={`/discover?category=${item.slug}` as Route}
              key={item.slug}
            >
              <WishCategoryIcon category={item.slug} className="mr-1.5 inline size-4" />{" "}
              {item.label}
            </Link>
          ))}
        </div>
        <section className="mt-7">
          {(wishes?.length ?? 0) > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishes!.map((wish) => {
                const item =
                  CATEGORIES.find((entry) => entry.slug === wish.category_slug) ??
                  CATEGORIES.at(-1)!;
                return (
                  <Link
                    className="surface rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                    href={`/wishes/${wish.id}` as Route}
                    key={wish.id}
                  >
                    <WishCategoryIcon
                      category={item.slug}
                      className="size-8 text-[#8b5fbd]"
                    />
                    <p className="mt-4 font-bold">{wish.title}</p>
                    {wish.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#826c73]">
                        {wish.description}
                      </p>
                    )}
                    {wish.estimated_cost_minor && (
                      <p className="mt-4 text-sm font-bold text-[#c53d68]">
                        ~ {formatRubles(wish.estimated_cost_minor)}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              actionHref="/wishes/new"
              actionLabel="Создать желание"
              description={
                categoryItem
                  ? `В категории «${categoryItem.label}» пока нет публичных желаний.`
                  : "Публичные желания участников появятся здесь после создания."
              }
              title="Пока нет желаний"
            />
          )}
        </section>
        <div className="mt-8 rounded-2xl bg-[#fff0cf] p-4 text-sm text-[#765b45]">
          <Search className="mr-1.5 inline size-4 align-text-bottom" /> Поиск по тексту
          будет подключён после появления первых публичных желаний и сборов.
        </div>
      </main>
    </>
  );
}
