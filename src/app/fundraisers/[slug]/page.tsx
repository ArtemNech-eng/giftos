import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, Gift, Lock, Share2, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { invitePrivateFundraiserMember } from "@/app/fundraisers/actions";
import { sendTestFundraiserGift } from "@/app/fundraisers/gifts/actions";
import {
  postFundraiserComment,
  startFundraiserSupport,
} from "@/app/fundraisers/support-actions";
import { toggleFundraiserFollow } from "@/app/social/actions";
import { CopyFundraiserLinkButton } from "@/components/copy-fundraiser-link-button";
import { EmptyState } from "@/components/empty-state";
import { LiveDiscussionRefresh } from "@/components/live-discussion-refresh";
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!hasSupabaseEnvironment()) return { robots: { index: false, follow: false } };
  const supabase = await createClient();
  const { data: fundraiser } = await supabase
    .from("public_fundraiser_feed")
    .select("title, description")
    .eq("slug", slug)
    .maybeSingle();
  if (!fundraiser) return { robots: { index: false, follow: false } };

  const description =
    fundraiser.description ?? `Публичная цель в «Хочу также»: ${fundraiser.title}.`;
  return {
    title: `${fundraiser.title} — поддержать в «Хочу также»`,
    description,
    alternates: { canonical: `/fundraisers/${slug}` },
    openGraph: {
      title: `${fundraiser.title} — «Хочу также»`,
      description,
      type: "article",
      images: [
        {
          url: `/og?type=fundraiser&title=${encodeURIComponent(fundraiser.title)}&subtitle=${encodeURIComponent(description.slice(0, 160))}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function FundraiserPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ invite?: string; supported?: string }>;
}) {
  const [{ slug }, { invite, supported }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: fundraiser } = await supabase
    .from("fundraisers")
    .select(
      "id, author_id, slug, title, description, cover_image_path, category_slug, target_amount_minor, current_amount_minor, participant_count, visibility, status, ends_at, published_at",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!fundraiser) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id === fundraiser.author_id;
  const { data: existingFundraiserFollow } =
    user && !isAuthor
      ? await supabase
          .from("fundraiser_follows")
          .select("profile_id")
          .eq("profile_id", user.id)
          .eq("fundraiser_id", fundraiser.id)
          .maybeSingle()
      : { data: null };

  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name, city, show_city")
    .eq("id", fundraiser.author_id)
    .maybeSingle();
  const { data: comments } = await supabase
    .from("fundraiser_comment_feed")
    .select("id, display_author_id, body, support_id, support_visibility, created_at")
    .eq("fundraiser_id", fundraiser.id)
    .order("created_at", { ascending: true });
  const commenterIds = [
    ...new Set(
      (comments ?? [])
        .map((comment) => comment.display_author_id)
        .filter((authorId): authorId is string => Boolean(authorId)),
    ),
  ];
  const { data: commenterProfiles } = commenterIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", commenterIds)
    : { data: [] };
  const commenterById = new Map(
    (commenterProfiles ?? []).map((profile) => [profile.id, profile]),
  );
  const [{ data: giftCatalog }, { count: giftCount }] = await Promise.all([
    supabase
      .from("virtual_gifts")
      .select("code, label, emoji, price_minor")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("fundraiser_gifts")
      .select("*", { count: "exact", head: true })
      .eq("fundraiser_id", fundraiser.id),
  ]);

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
          {supported === "1" && (
            <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Спасибо! Поддержка подтверждена, а ваше сообщение добавлено в обсуждение.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#ead9df] bg-white px-4 text-sm font-semibold text-[#765f66] transition hover:border-[#df4f7d]"
              type="button"
            >
              <Share2 className="size-4" /> Поделиться
            </button>
            {user && !isAuthor && (
              <>
                <form action={toggleFundraiserFollow}>
                  <input name="fundraiser_id" type="hidden" value={fundraiser.id} />
                  <input name="fundraiser_slug" type="hidden" value={fundraiser.slug} />
                  <button
                    className={`inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold transition ${existingFundraiserFollow ? "border border-[#ead9df] bg-white text-[#765f66] hover:border-[#df4f7d]" : "bg-[#fce5ec] text-[#bd3e66] hover:bg-[#f8d9e4]"}`}
                    type="submit"
                  >
                    {existingFundraiserFollow ? "Вы следите" : "Следить за сбором"}
                  </button>
                </form>
                <CopyFundraiserLinkButton slug={fundraiser.slug} />
                <ReportForm
                  returnTo={`/fundraisers/${fundraiser.slug}`}
                  targetId={fundraiser.id}
                  targetType="fundraiser"
                />
              </>
            )}
          </div>
          {user && fundraiser.status === "active" ? (
            <form
              action={startFundraiserSupport}
              className="mt-6 rounded-2xl border border-[#f0e1e5] bg-[#fffafb] p-4 sm:p-5"
            >
              <input name="fundraiser_id" type="hidden" value={fundraiser.id} />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="grow">
                  <label
                    className="mb-1.5 block text-sm font-semibold text-[#5c464d]"
                    htmlFor="support-amount"
                  >
                    Поддержать на, ₽
                  </label>
                  <input
                    className="h-11 w-full rounded-xl border border-[#e7d8dc] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#b3a0a6] focus:border-[#df4f7d] focus:ring-4 focus:ring-[#df4f7d]/10"
                    id="support-amount"
                    inputMode="decimal"
                    min="1"
                    name="amount"
                    placeholder="2000"
                    required
                    type="number"
                  />
                </div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#df4f7d] px-5 text-sm font-bold text-white transition hover:bg-[#c93f6d]"
                  type="submit"
                >
                  <Gift className="size-4" /> Поддержать
                </button>
              </div>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-[#5c464d]">
                  Сообщение вместе с поддержкой
                </span>
                <textarea
                  className="min-h-20 w-full rounded-xl border border-[#e7d8dc] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#b3a0a6] focus:border-[#df4f7d] focus:ring-4 focus:ring-[#df4f7d]/10"
                  maxLength={1000}
                  name="message"
                  placeholder="Например: С днём рождения! ❤️"
                />
              </label>
              <fieldset className="mt-4">
                <legend className="text-sm font-semibold text-[#5c464d]">
                  Как показать поддержку?
                </legend>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#725c63]">
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      defaultChecked
                      name="visibility"
                      type="radio"
                      value="exact"
                    />{" "}
                    С суммой
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input name="visibility" type="radio" value="activity_only" />{" "}
                    Только факт участия
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input name="visibility" type="radio" value="anonymous" /> Анонимно
                  </label>
                </div>
              </fieldset>
              <p className="mt-3 text-xs leading-5 text-[#9b858c]">
                Сейчас используется тестовый платёжный режим: реальные деньги не
                списываются.
              </p>
            </form>
          ) : !user ? (
            <Link
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#df4f7d] px-5 text-sm font-bold text-white transition hover:bg-[#c93f6d]"
              href="/auth/sign-in"
            >
              <Gift className="size-4" /> Войти, чтобы поддержать
            </Link>
          ) : null}
        </div>
      </section>
      {isAuthor && fundraiser.visibility === "private" && (
        <section className="surface mt-6 rounded-2xl p-5 sm:p-6">
          <p className="text-sm font-semibold text-[#bd3e66]">
            Доступ к приватному сбору
          </p>
          <h2 className="mt-1 text-xl font-bold">Пригласить участника</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#826c73]">
            Введите username пользователя. Он увидит приглашение в личном разделе и сам
            подтвердит доступ.
          </p>
          <form
            action={invitePrivateFundraiserMember}
            className="mt-5 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            <input name="fundraiser_id" type="hidden" value={fundraiser.id} />
            <input name="fundraiser_slug" type="hidden" value={fundraiser.slug} />
            <label className="sr-only" htmlFor="invite-username">
              Username пользователя
            </label>
            <div className="relative grow">
              <span className="absolute left-3.5 top-2.5 text-sm text-[#9b858c]">
                @
              </span>
              <input
                className="h-11 w-full rounded-xl border border-[#e7d8dc] bg-white pl-7 pr-3.5 text-sm outline-none transition placeholder:text-[#b3a0a6] focus:border-[#df4f7d] focus:ring-4 focus:ring-[#df4f7d]/10"
                id="invite-username"
                maxLength={30}
                name="username"
                placeholder="username"
                required
              />
            </div>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
              type="submit"
            >
              Пригласить
            </button>
          </form>
          {invite === "already-member" && (
            <p className="mt-3 text-sm text-emerald-700">
              Этот пользователь уже принял приглашение.
            </p>
          )}
          {invite?.startsWith("invited-") && (
            <p className="mt-3 text-sm text-emerald-700">
              Приглашение для @{invite.slice("invited-".length)} отправлено.
            </p>
          )}
        </section>
      )}
      <section className="mt-6" id="discussion">
        <LiveDiscussionRefresh fundraiserId={fundraiser.id} />
        <div className="surface rounded-2xl p-5 sm:p-6">
          <p className="text-sm font-semibold text-[#bd3e66]">Люди вокруг цели</p>
          <h2 className="mt-1 text-2xl font-bold">Обсуждение</h2>
          {user && !isAuthor && giftCatalog && giftCatalog.length > 0 && (
            <div className="mt-5 rounded-xl bg-[#fff8f9] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#bd3e66]">
                  Отправить подарок автору
                </p>
                <span className="text-xs text-[#9b858c]">
                  {giftCount ?? 0} подарков
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {giftCatalog.map((gift) => (
                  <form action={sendTestFundraiserGift} key={gift.code}>
                    <input name="fundraiser_id" type="hidden" value={fundraiser.id} />
                    <input name="slug" type="hidden" value={fundraiser.slug} />
                    <input name="gift_code" type="hidden" value={gift.code} />
                    <button
                      className="flex w-full flex-col items-center rounded-xl border border-[#ead9df] bg-white px-1 py-2 transition hover:border-[#df4f7d]"
                      type="submit"
                    >
                      <span className="text-2xl">{gift.emoji}</span>
                      <span className="mt-1 text-[10px] text-[#674f57]">
                        {gift.label}
                      </span>
                      <span className="text-[10px] font-semibold text-[#c53d68]">
                        {gift.price_minor / 100} ₽
                      </span>
                    </button>
                  </form>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#9b858c]">
                Подарки в тестовом режиме формируют test-доход автора.
              </p>
            </div>
          )}
          {user ? (
            <form action={postFundraiserComment} className="mt-5">
              <input name="fundraiser_id" type="hidden" value={fundraiser.id} />
              <input name="fundraiser_slug" type="hidden" value={fundraiser.slug} />
              <label className="sr-only" htmlFor="comment-body">
                Новое сообщение
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <textarea
                  className="min-h-11 grow rounded-xl border border-[#e7d8dc] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#b3a0a6] focus:border-[#df4f7d] focus:ring-4 focus:ring-[#df4f7d]/10"
                  id="comment-body"
                  maxLength={2000}
                  name="body"
                  placeholder="Поделитесь мыслью или поддержите автора…"
                  required
                />
                <button
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
                  type="submit"
                >
                  Отправить
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-5 text-sm text-[#826c73]">
              Чтобы участвовать в обсуждении,{" "}
              <Link className="font-semibold text-[#a13d5e]" href="/auth/sign-in">
                войдите в «Хочу также»
              </Link>
              .
            </p>
          )}
          {(comments?.length ?? 0) > 0 ? (
            <div className="mt-6 space-y-4">
              {comments!.map((comment) => {
                const commenter = comment.display_author_id
                  ? commenterById.get(comment.display_author_id)
                  : null;
                const isAnonymousSupport =
                  comment.support_id && comment.support_visibility === "anonymous";
                const createdAt = new Intl.DateTimeFormat("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(comment.created_at));
                const displayName = isAnonymousSupport
                  ? "Анонимный участник"
                  : (commenter?.display_name ?? "Участник «Хочу также»");
                return (
                  <article className="flex gap-3" key={comment.id}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f5d9e2] text-sm font-bold text-[#a64c68]">
                      {displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-bold">{displayName}</span>
                        {comment.support_id && (
                          <span className="ml-2 rounded-full bg-[#fff0cf] px-2 py-0.5 text-xs font-semibold text-[#a76a22]">
                            {isAnonymousSupport
                              ? "Поддержал анонимно"
                              : "Поддержал сбор"}
                          </span>
                        )}
                        <span className="ml-2 text-xs text-[#9b858c]">{createdAt}</span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#604a52]">
                        {comment.body}
                      </p>
                      {user && comment.display_author_id !== user.id && (
                        <div className="mt-1">
                          <ReportForm
                            returnTo={`/fundraisers/${fundraiser.slug}`}
                            targetId={comment.id}
                            targetType="comment"
                          />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                description="Будьте первым, кто поддержит автора словами. Сообщение вместе с поддержкой тоже появится здесь."
                title="Обсуждение только начинается"
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
