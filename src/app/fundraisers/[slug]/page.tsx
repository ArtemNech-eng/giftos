import Link from "next/link";
import { CalendarDays, Gift, Lock, Share2, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { CATEGORIES } from "@/lib/constants";
import { getSignedImageUrl } from "@/lib/media";
import { formatRubles } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FundraiserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: fundraiser } = await supabase
    .from("fundraisers")
    .select(
      "id, author_id, slug, title, description, cover_image_path, category_slug, target_amount_minor, current_amount_minor, participant_count, visibility, status, ends_at, published_at",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!fundraiser) notFound();

  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name, city, show_city")
    .eq("id", fundraiser.author_id)
    .maybeSingle();
  const coverImageUrl = await getSignedImageUrl({
    bucket: "fundraiser-media",
    path: fundraiser.cover_image_path,
  });
  const category =
    CATEGORIES.find((item) => item.slug === fundraiser.category_slug) ??
    CATEGORIES.at(-1)!;
  const progress = Math.min(
    100,
    Math.round(
      (Number(fundraiser.current_amount_minor) /
        Number(fundraiser.target_amount_minor)) *
        100,
    ),
  );
  const endsAt = fundraiser.ends_at
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(fundraiser.ends_at))
    : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link className="text-sm font-semibold text-[#a13d5e]" href="/">
        ← К ленте
      </Link>
      <section className="surface mt-5 overflow-hidden rounded-[2rem]">
        <div className="relative grid min-h-44 place-items-center overflow-hidden bg-gradient-to-br from-[#fde3bc] to-[#f6b9aa] p-8 text-7xl">
          {coverImageUrl ? (
            // A signed URL is issued only after the fundraiser row passed RLS above.
            // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL has no stable host for Image config
            <img
              alt=""
              className="absolute inset-0 size-full object-cover"
              src={coverImageUrl}
            />
          ) : (
            category.emoji
          )}
        </div>
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#866e75]">
            <span className="rounded-full bg-[#fce5ec] px-2.5 py-1 font-semibold text-[#bd3e66]">
              {category.label}
            </span>
            {fundraiser.visibility === "unlisted" && (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3.5" /> По ссылке
              </span>
            )}
            {fundraiser.visibility === "private" && (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3.5" /> Приватный
              </span>
            )}
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {fundraiser.title}
          </h1>
          {author && (
            <p className="mt-3 text-sm text-[#765f66]">
              Сбор{" "}
              {author.username ? (
                <Link
                  className="font-semibold text-[#a13d5e]"
                  href={`/u/${author.username}`}
                >
                  {author.display_name}
                </Link>
              ) : (
                author.display_name
              )}
              {author.show_city && author.city ? ` · ${author.city}` : ""}
            </p>
          )}
          {fundraiser.description && (
            <p className="mt-5 max-w-2xl whitespace-pre-wrap text-[15px] leading-7 text-[#654e55]">
              {fundraiser.description}
            </p>
          )}
          <div className="mt-8 rounded-2xl bg-[#fff8f9] p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-2xl font-bold text-[#c53d68]">
                {formatRubles(fundraiser.current_amount_minor)}
              </p>
              <p className="text-sm text-[#826c73]">
                из {formatRubles(fundraiser.target_amount_minor)}
              </p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#f7e3e9]">
              <div
                className="h-full rounded-full bg-[#df4f7d]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#816970]">
              <span className="inline-flex items-center gap-1.5">
                <UsersRound className="size-4" /> {fundraiser.participant_count}{" "}
                участников
              </span>
              {endsAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" /> До {endsAt}
                </span>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#df4f7d] px-5 text-sm font-bold text-white opacity-70"
              disabled
              type="button"
            >
              <Gift className="size-4" /> Поддержка — следующий этап
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#ead9df] bg-white px-4 text-sm font-semibold text-[#765f66] transition hover:border-[#df4f7d]"
              type="button"
            >
              <Share2 className="size-4" /> Поделиться
            </button>
          </div>
        </div>
      </section>
      <section className="mt-6">
        <EmptyState
          description="Чат под сбором появится вместе с поддержкой и Realtime. Здесь будут сообщения, вопросы и поздравления от участников."
          title="Обсуждение скоро появится"
        />
      </section>
    </main>
  );
}
