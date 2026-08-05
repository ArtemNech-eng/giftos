import Link from "next/link";
import type { Metadata, Route } from "next";
import { ExternalLink, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { cloneWish, toggleAlsoWantWish } from "@/app/wishes/actions";
import { CATEGORIES } from "@/lib/constants";
import { getSignedImageUrl } from "@/lib/media";
import { formatRubles } from "@/lib/money";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!hasSupabaseEnvironment()) return { robots: { index: false, follow: false } };
  const supabase = await createClient();
  const { data: wish } = await supabase
    .from("wishes")
    .select("title, description, visibility, is_archived")
    .eq("id", id)
    .maybeSingle();
  if (!wish || wish.visibility !== "public" || wish.is_archived)
    return { robots: { index: false, follow: false } };

  const description =
    wish.description ?? `Публичное желание в «Хочу также»: ${wish.title}.`;
  return {
    title: `${wish.title} — желание в «Хочу также»`,
    description,
    alternates: { canonical: `/wishes/${id}` },
    openGraph: { title: `${wish.title} — «Хочу также»`, description, type: "article" },
  };
}

export default async function WishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: wish } = await supabase
    .from("wishes")
    .select(
      "id, author_id, title, description, image_path, product_url, estimated_cost_minor, category_slug, also_wants_count, created_at",
    )
    .eq("id", id)
    .eq("visibility", "public")
    .eq("is_archived", false)
    .maybeSingle();
  if (!wish) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: existingAlsoWant } = user
    ? await supabase
        .from("wish_also_wants")
        .select("wish_id")
        .eq("wish_id", wish.id)
        .eq("profile_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", wish.author_id)
    .maybeSingle();
  const imageUrl = await getSignedImageUrl({
    bucket: "wish-media",
    path: wish.image_path,
  });
  const category =
    CATEGORIES.find((item) => item.slug === wish.category_slug) ?? CATEGORIES.at(-1)!;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link className="text-sm font-semibold text-[#a13d5e]" href="/">
        ← К ленте
      </Link>
      <article className="surface mt-5 overflow-hidden rounded-[2rem]">
        <div className="relative grid h-52 place-items-center overflow-hidden bg-gradient-to-br from-[#f5d9e8] to-[#d4b4d2] text-7xl">
          {imageUrl ? (
            // The wish itself has passed the public RLS check before signing the file.
            // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL has no stable host for Image config
            <img
              alt=""
              className="absolute inset-0 size-full object-cover"
              src={imageUrl}
            />
          ) : (
            category.emoji
          )}
        </div>
        <div className="p-6 sm:p-8">
          <span className="rounded-full bg-[#fff1f4] px-3 py-1.5 text-xs font-semibold text-[#a34c67]">
            {category.label}
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight">
            {wish.title}
          </h1>
          {author && (
            <p className="mt-3 text-sm text-[#816970]">
              Желание{" "}
              <Link
                className="font-semibold text-[#a13d5e]"
                href={`/u/${author.username}` as Route}
              >
                {author.display_name}
              </Link>
            </p>
          )}
          {wish.description && (
            <p className="mt-5 whitespace-pre-wrap leading-7 text-[#654e55]">
              {wish.description}
            </p>
          )}
          {wish.estimated_cost_minor && (
            <p className="mt-6 text-xl font-bold text-[#c53d68]">
              Примерная стоимость: {formatRubles(wish.estimated_cost_minor)}
            </p>
          )}
          <div className="mt-6 rounded-xl bg-[#fff0cf] px-4 py-3 text-sm text-[#765b45]">
            ✨ <b>{wish.also_wants_count ?? 0}</b> человек тоже хотят это
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {user ? (
              <form action={toggleAlsoWantWish}>
                <input name="wish_id" type="hidden" value={wish.id} />
                <button
                  className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold ${existingAlsoWant ? "border border-[#df4f7d] bg-white text-[#bd3e66]" : "bg-[#df4f7d] text-white"}`}
                  type="submit"
                >
                  <Sparkles className="size-4" />{" "}
                  {existingAlsoWant ? "Уже хочу" : "Хочу также"}
                </button>
              </form>
            ) : (
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#df4f7d] px-5 text-sm font-bold text-white"
                href="/auth/sign-in"
              >
                <Sparkles className="size-4" /> Хочу также
              </Link>
            )}
            <form action={cloneWish}>
              <input name="source_wish_id" type="hidden" value={wish.id} />
              <button
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#df4f7d] px-5 text-sm font-bold text-white transition hover:bg-[#c93f6d]"
                type="submit"
              >
                <Sparkles className="size-4" /> Я тоже хочу
              </button>
            </form>
            {wish.product_url && (
              <a
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#ead9df] bg-white px-4 text-sm font-semibold text-[#765f66] transition hover:border-[#df4f7d]"
                href={wish.product_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-4" /> Посмотреть товар
              </a>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
