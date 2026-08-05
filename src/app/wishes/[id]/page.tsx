import Link from "next/link";
import type { Metadata, Route } from "next";
import {
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { promoteWishWithBonus } from "@/app/bonuses/actions";
import { cloneWish, postWishComment, toggleAlsoWantWish } from "@/app/wishes/actions";
import { LiveWishDiscussionRefresh } from "@/components/live-wish-discussion-refresh";
import { ReportForm } from "@/components/report-form";
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

type CommentRow = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

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
  const isAuthor = user?.id === wish.author_id;
  const { data: existingAlsoWant } = user
    ? await supabase
        .from("wish_also_wants")
        .select("wish_id")
        .eq("wish_id", wish.id)
        .eq("profile_id", user.id)
        .maybeSingle()
    : { data: null };

  const [{ data: author }, { data: comments }, { data: alsoWanters }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", wish.author_id)
        .maybeSingle(),
      supabase
        .from("wish_comments")
        .select("id, author_id, body, created_at")
        .eq("wish_id", wish.id)
        .order("created_at", { ascending: true })
        .limit(100),
      supabase
        .from("wish_also_wants")
        .select("profile_id, created_at")
        .eq("wish_id", wish.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const commentAuthorIds = [...new Set((comments ?? []).map((c) => c.author_id))];
  const alsoWantIds = (alsoWanters ?? []).map((item) => item.profile_id);
  const profileIds = [...new Set([...commentAuthorIds, ...alsoWantIds])];
  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", profileIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const imageUrl = await getSignedImageUrl({
    bucket: "wish-media",
    path: wish.image_path,
  });
  const category =
    CATEGORIES.find((item) => item.slug === wish.category_slug) ?? CATEGORIES.at(-1)!;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Назад"
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href={author ? (`/u/${author.username}` as Route) : "/feed"}
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Желание</h1>
        <span className="w-9" />
      </header>

      <article className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[#171923]">
        <div className="relative grid h-52 place-items-center overflow-hidden bg-gradient-to-br from-[#3b193d] via-[#1f1a38] to-[#151a2c] text-7xl">
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
        <div className="p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#e7c9f5]">
              {category.label}
            </span>
          </div>
          <h2 className="mt-3 text-balance text-2xl font-bold">{wish.title}</h2>
          {author && (
            <p className="mt-2 text-sm text-[#b9b1c5]">
              Желание{" "}
              <Link
                className="font-semibold text-[#e3a3d5]"
                href={`/u/${author.username}` as Route}
              >
                {author.display_name}
              </Link>
            </p>
          )}
          {wish.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#d8d0e0]">
              {wish.description}
            </p>
          )}
          {wish.estimated_cost_minor && (
            <p className="mt-5 text-lg font-bold text-[#ff9bc5]">
              Примерная стоимость: {formatRubles(wish.estimated_cost_minor)}
            </p>
          )}
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#281633] px-4 py-3 text-sm text-[#ffd0eb]">
            <Sparkles className="size-4 shrink-0 text-[#ffb7dd]" />
            <b>{wish.also_wants_count ?? 0}</b> человек тоже хотят это
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {user ? (
              <form action={toggleAlsoWantWish}>
                <input name="wish_id" type="hidden" value={wish.id} />
                <button
                  className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold ${
                    existingAlsoWant
                      ? "border border-[#ff77ba]/50 bg-white/5 text-[#ffb7dd]"
                      : "bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] text-white"
                  }`}
                  type="submit"
                >
                  <Sparkles className="size-4" />{" "}
                  {existingAlsoWant ? "Уже хочу" : "Хочу также"}
                </button>
              </form>
            ) : (
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold text-white"
                href="/auth/sign-in"
              >
                <Sparkles className="size-4" /> Хочу также
              </Link>
            )}
            <form action={cloneWish}>
              <input name="source_wish_id" type="hidden" value={wish.id} />
              <button
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold text-white transition hover:opacity-90"
                type="submit"
              >
                <Sparkles className="size-4" /> Я тоже хочу
              </button>
            </form>
            {wish.product_url && (
              <a
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-[#e7e1ee] transition hover:border-[#ff77ba]"
                href={wish.product_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-4" /> Товар
              </a>
            )}
          </div>
          {isAuthor && (
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={promoteWishWithBonus}>
                <input name="wish_id" type="hidden" value={wish.id} />
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#ffd35e]/40 bg-[#2a2215] px-4 text-sm font-bold text-[#ffd35e]"
                  type="submit"
                >
                  ⭐ Продвинуть за 500 ⭐
                </button>
              </form>
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#6fe3a1]/40 bg-[#15281d] px-4 text-sm font-bold text-[#8df0b4]"
                href="/fundraisers/new"
              >
                Создать сбор
              </Link>
            </div>
          )}
        </div>
      </article>

      {alsoWanters && alsoWanters.length > 0 && (
        <section className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
          <div className="flex items-center gap-2">
            <UsersRound className="size-5 text-[#d68cff]" />
            <h2 className="font-bold">Хотят также</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {alsoWanters.map((item) => {
              const profile = profileById.get(item.profile_id);
              return (
                <Link
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[#e7e1ee]"
                  href={profile ? (`/u/${profile.username}` as Route) : "/feed"}
                  key={item.profile_id}
                >
                  {profile?.display_name ?? "Зритель"}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section
        className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4"
        id="discussion"
      >
        <LiveWishDiscussionRefresh wishId={wish.id} />
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-[#d68cff]" />
          <h2 className="font-bold">Обсуждение</h2>
        </div>
        {user ? (
          <form action={postWishComment} className="mt-4">
            <input name="wish_id" type="hidden" value={wish.id} />
            <label className="sr-only" htmlFor="wish-comment-body">
              Новое сообщение
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <textarea
                className="min-h-11 grow rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none placeholder:text-[#a9a1b4] focus:border-[#ff77ba]"
                id="wish-comment-body"
                maxLength={2000}
                name="body"
                placeholder="Поделитесь мыслью или поддержите автора…"
                required
              />
              <button
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold text-white"
                type="submit"
              >
                Отправить
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-4 rounded-xl bg-white/5 px-3 py-2.5 text-sm text-[#a9a1b4]">
            <Link className="font-semibold text-[#e3a3d5]" href="/auth/sign-in">
              Войдите
            </Link>
            , чтобы участвовать в обсуждении.
          </p>
        )}
        <div className="mt-4 space-y-3">
          {(comments ?? []).length === 0 ? (
            <p className="text-sm text-[#a9a1b4]">
              Пока тихо — станьте первым, кто поддержит желание словом.
            </p>
          ) : (
            (comments ?? []).map((comment: CommentRow) => {
              const commentAuthor = profileById.get(comment.author_id);
              return (
                <div className="rounded-xl bg-white/5 p-3" key={comment.id}>
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 grow truncate text-sm">
                      <b>
                        {comment.author_id === user?.id
                          ? "Вы"
                          : (commentAuthor?.display_name ?? "Зритель")}
                      </b>
                    </p>
                    {user && comment.author_id !== user.id && (
                      <ReportForm
                        returnTo={`/wishes/${wish.id}#discussion`}
                        targetId={comment.id}
                        targetType="wish_comment"
                      />
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#d8d0e0]">
                    {comment.body}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
