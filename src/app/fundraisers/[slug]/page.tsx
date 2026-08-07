import Link from "next/link";
import type { Metadata, Route } from "next";
/* eslint-disable @next/next/no-img-element -- avatars and fundraiser media use signed Storage URLs */
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  EyeOff,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { invitePrivateFundraiserMember } from "@/app/fundraisers/actions";
import {
  postFundraiserComment,
  startFundraiserSupport,
} from "@/app/fundraisers/support-actions";
import { toggleFundraiserFollow } from "@/app/social/actions";
import { CopyFundraiserLinkButton } from "@/components/copy-fundraiser-link-button";
import { LiveDiscussionRefresh } from "@/components/live-discussion-refresh";
import { ReportForm } from "@/components/report-form";
import { WishCategoryIcon } from "@/components/wish-category-icon";
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

type CommentRow = {
  id: string;
  display_author_id: string | null;
  body: string;
  support_id: string | null;
  support_visibility: "exact" | "activity_only" | "anonymous" | null;
  created_at: string;
};
type Person = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

function PersonAvatar({ person, size = "size-8" }: { person: Person; size?: string }) {
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] p-px`}
    >
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f8f4fc] text-[9px] font-black text-[#372c41]">
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
    </span>
  );
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

  const [{ data: rawAuthor }, { data: comments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_path, city, show_city")
      .eq("id", fundraiser.author_id)
      .maybeSingle(),
    supabase
      .from("fundraiser_comment_feed")
      .select("id, display_author_id, body, support_id, support_visibility, created_at")
      .eq("fundraiser_id", fundraiser.id)
      .order("created_at", { ascending: true }),
  ]);
  const profileIds = [
    ...new Set(
      [
        rawAuthor?.id ?? "",
        ...(comments ?? [])
          .map((comment) => comment.display_author_id)
          .filter((authorId): authorId is string => Boolean(authorId)),
      ].filter(Boolean),
    ),
  ];
  const { data: rawPeople } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_path")
        .in("id", profileIds)
    : { data: [] };
  const people = new Map<string, Person>();
  for (const profile of rawPeople ?? []) {
    people.set(profile.id, {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: await getSignedImageUrl({
        bucket: "avatars",
        path: profile.avatar_path,
      }),
    });
  }
  const author = rawAuthor ? (people.get(rawAuthor.id) ?? null) : null;

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
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к истории автора"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href={author ? (`/u/${author.username}` as Route) : "/feed"}
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Общая цель
          </small>
          <h1 className="mt-0.5 text-sm font-black">Сбор</h1>
        </span>
        {user && !isAuthor ? (
          <ReportForm
            returnTo={`/fundraisers/${fundraiser.slug}`}
            targetId={fundraiser.id}
            targetType="fundraiser"
          />
        ) : (
          <span className="w-10" />
        )}
      </header>

      <article className="border-[#2c2036]/9 mt-5 overflow-hidden rounded-[1.8rem] border bg-white p-4 shadow-[0_14px_32px_rgba(69,43,94,.08)]">
        <div className="flex items-start gap-4">
          <span className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#fff0e3] to-[#f5e9ff] text-[#8753e6]">
            {coverImageUrl ? (
              <img
                loading="lazy"
                decoding="async"
                alt=""
                className="size-full object-cover"
                src={coverImageUrl}
              />
            ) : (
              <WishCategoryIcon
                category={fundraiser.category_slug}
                className="size-10"
              />
            )}
          </span>
          <span className="min-w-0 grow">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0e9ff] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#7549d0]">
              <WishCategoryIcon
                category={fundraiser.category_slug}
                className="size-3"
              />{" "}
              {category.label}
            </span>
            <h2 className="mt-3 text-xl font-black leading-[0.95] tracking-[-0.055em]">
              {fundraiser.title}
            </h2>
            {fundraiser.visibility !== "public" && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#f3eef7] px-2 py-1 text-[8px] font-black text-[#756a7d]">
                {fundraiser.visibility === "private" ? (
                  <EyeOff className="size-3" />
                ) : (
                  <Lock className="size-3" />
                )}
                {fundraiser.visibility === "private" ? "Приватный" : "По ссылке"}
              </span>
            )}
          </span>
        </div>

        {author && (
          <Link
            className="mt-4 flex items-center gap-2 rounded-2xl bg-[#fbf9fe] p-2.5 transition hover:bg-[#f5effa]"
            href={`/u/${author.username}` as Route}
          >
            <PersonAvatar person={author} />
            <span className="min-w-0 grow">
              <b className="block truncate text-[10px]">{author.displayName}</b>
              <small className="mt-0.5 flex items-center gap-1 text-[9px] text-[#82758a]">
                <span>Автор цели</span>
                {rawAuthor?.show_city && rawAuthor.city && (
                  <>
                    <span className="size-1 rounded-full bg-[#b0a5b7]" />
                    <MapPin className="size-3" /> {rawAuthor.city}
                  </>
                )}
              </small>
            </span>
            <ChevronRight className="size-3.5 text-[#a295a8]" />
          </Link>
        )}

        {fundraiser.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#5f5369]">
            {fundraiser.description}
          </p>
        )}

        <section className="mt-5 rounded-[1.35rem] bg-[#fbf9fe] p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span>
              <small className="block text-[9px] font-black uppercase tracking-[0.1em] text-[#93869d]">
                Собрано
              </small>
              <b className="mt-1 block text-xl tracking-[-0.04em] text-[#c34e79]">
                {formatRubles(fundraiser.current_amount_minor)}
              </b>
            </span>
            <span className="text-right">
              <small className="block text-[9px] font-black uppercase tracking-[0.1em] text-[#93869d]">
                Цель
              </small>
              <b className="mt-1 block text-sm">
                {formatRubles(fundraiser.target_amount_minor)}
              </b>
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee7f4]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff5d9a] to-[#8254ed]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#756a7d]">
            <span className="inline-flex items-center gap-1">
              <UsersRound className="size-3.5 text-[#8753e6]" />{" "}
              {fundraiser.participant_count} участвуют
            </span>
            {endsAt && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5 text-[#8753e6]" /> До {endsAt}
              </span>
            )}
          </div>
        </section>
      </article>

      {supported === "1" && (
        <section className="mt-4 flex items-center gap-2 rounded-2xl border border-[#bde6d4] bg-[#effaf4] p-3.5 text-[#258b82]">
          <Check className="size-4 shrink-0" />
          <p className="text-[10px] font-black">
            Поддержка подтверждена, а сообщение добавлено в обсуждение.
          </p>
        </section>
      )}

      <section className="mt-4 flex flex-wrap gap-2">
        {user && !isAuthor && (
          <form action={toggleFundraiserFollow}>
            <input name="fundraiser_id" type="hidden" value={fundraiser.id} />
            <input name="fundraiser_slug" type="hidden" value={fundraiser.slug} />
            <button
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[10px] font-black ${
                existingFundraiserFollow
                  ? "border border-[#dfd5e5] bg-white text-[#665a72]"
                  : "bg-[#f0e9ff] text-[#7549d0]"
              }`}
              type="submit"
            >
              <Heart className="size-3.5" />{" "}
              {existingFundraiserFollow ? "Ты следишь" : "Следить"}
            </button>
          </form>
        )}
        <CopyFundraiserLinkButton slug={fundraiser.slug} />
      </section>

      {user && fundraiser.status === "active" && !isAuthor ? (
        <section className="mt-5 rounded-[1.55rem] border border-[#e5d5ea] bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
              <Heart className="size-4" />
            </span>
            <span>
              <h2 className="text-sm font-black">Поддержать цель</h2>
              <p className="mt-1 text-[10px] leading-4 text-[#756a7d]">
                Ты сам(а) выбираешь сумму и как показать своё участие.
              </p>
            </span>
          </div>
          <form action={startFundraiserSupport} className="mt-4">
            <input name="fundraiser_id" type="hidden" value={fundraiser.id} />
            <label className="block" htmlFor="support-amount">
              <span className="text-[10px] font-black text-[#65596e]">
                Сумма поддержки, ₽
              </span>
              <input
                className="mt-1.5 h-11 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
                id="support-amount"
                inputMode="decimal"
                min="1"
                name="amount"
                placeholder="Например, 500"
                required
                type="number"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-[10px] font-black text-[#65596e]">
                Сообщение вместе с поддержкой
              </span>
              <textarea
                className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
                maxLength={1000}
                name="message"
                placeholder="Поддержи автора несколькими словами…"
              />
            </label>
            <fieldset className="mt-3">
              <legend className="text-[10px] font-black text-[#65596e]">
                Как показать участие?
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[9px] font-bold text-[#665a72]">
                <label className="border-[#2c2036]/9 rounded-xl border bg-[#fbf9fe] p-2">
                  <input
                    className="mr-1"
                    defaultChecked
                    name="visibility"
                    type="radio"
                    value="exact"
                  />{" "}
                  Сумма
                </label>
                <label className="border-[#2c2036]/9 rounded-xl border bg-[#fbf9fe] p-2">
                  <input
                    className="mr-1"
                    name="visibility"
                    type="radio"
                    value="activity_only"
                  />{" "}
                  Участие
                </label>
                <label className="border-[#2c2036]/9 rounded-xl border bg-[#fbf9fe] p-2">
                  <input
                    className="mr-1"
                    name="visibility"
                    type="radio"
                    value="anonymous"
                  />{" "}
                  Анонимно
                </label>
              </div>
            </fieldset>
            <p className="mt-3 flex gap-2 rounded-xl bg-[#fff7e8] p-3 text-[10px] leading-4 text-[#896a27]">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              Тестовый режим: форма проходит безопасный сценарий, но реальные деньги не
              списываются.
            </p>
            <button
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3 text-xs font-black text-white"
              type="submit"
            >
              <Heart className="size-3.5" /> Перейти к тестовому подтверждению
            </button>
          </form>
        </section>
      ) : !user ? (
        <Link
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3 text-xs font-black text-white"
          href="/auth/sign-in"
        >
          <Heart className="size-3.5" /> Войти, чтобы поддержать
        </Link>
      ) : null}

      {isAuthor && fundraiser.visibility === "private" && (
        <section className="mt-5 rounded-[1.55rem] border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <h2 className="flex items-center gap-2 text-sm font-black">
            <Lock className="size-4 text-[#8753e6]" /> Доступ к приватному сбору
          </h2>
          <p className="mt-2 text-[10px] leading-4 text-[#756a7d]">
            Пригласи человека по username. Он увидит приглашение и сам подтвердит
            доступ.
          </p>
          <form action={invitePrivateFundraiserMember} className="mt-3 flex gap-2">
            <input name="fundraiser_id" type="hidden" value={fundraiser.id} />
            <input name="fundraiser_slug" type="hidden" value={fundraiser.slug} />
            <input
              className="min-w-0 grow rounded-xl border border-[#2c2036]/10 bg-white px-3 py-2.5 text-xs outline-none placeholder:text-[#aaa0ae]"
              id="invite-username"
              maxLength={30}
              name="username"
              placeholder="username"
              required
            />
            <button
              className="rounded-xl bg-[#f0e9ff] px-3 text-[10px] font-black text-[#7549d0]"
              type="submit"
            >
              Позвать
            </button>
          </form>
          {invite === "already-member" && (
            <p className="mt-2 text-[10px] font-bold text-[#258b82]">
              Этот человек уже участник.
            </p>
          )}
          {invite?.startsWith("invited-") && (
            <p className="mt-2 text-[10px] font-bold text-[#258b82]">
              Приглашение отправлено.
            </p>
          )}
        </section>
      )}

      <section
        className="border-[#2c2036]/9 mt-5 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
        id="discussion"
      >
        <LiveDiscussionRefresh fundraiserId={fundraiser.id} />
        <div className="flex items-center justify-between">
          <span>
            <h2 className="flex items-center gap-2 text-sm font-black">
              <MessageCircle className="size-4 text-[#8753e6]" /> Обсуждение
            </h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">Люди вокруг общей цели</p>
          </span>
          <ShieldCheck className="size-4 text-[#258b82]" />
        </div>
        {user ? (
          <form action={postFundraiserComment} className="mt-4">
            <input name="fundraiser_id" type="hidden" value={fundraiser.id} />
            <input name="fundraiser_slug" type="hidden" value={fundraiser.slug} />
            <textarea
              className="min-h-20 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              maxLength={2000}
              name="body"
              placeholder="Поделись мыслью или поддержи автора…"
              required
            />
            <button
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2.5 text-[10px] font-black text-white"
              type="submit"
            >
              <MessageCircle className="size-3.5" /> Отправить
            </button>
          </form>
        ) : (
          <p className="mt-4 rounded-xl bg-[#fbf9fe] p-3 text-[10px] leading-4 text-[#756a7d]">
            <Link className="font-black text-[#7549d0]" href="/auth/sign-in">
              Войди
            </Link>
            , чтобы участвовать в обсуждении.
          </p>
        )}
        <div className="mt-4 space-y-2.5">
          {(comments ?? []).length === 0 ? (
            <p className="rounded-xl bg-[#fbf9fe] p-3 text-[10px] leading-4 text-[#82758a]">
              Пока тихо. Первое тёплое сообщение может начать разговор.
            </p>
          ) : (
            (comments ?? []).map((comment: CommentRow) => {
              const person = comment.display_author_id
                ? people.get(comment.display_author_id)
                : null;
              const anonymous = Boolean(
                comment.support_id && comment.support_visibility === "anonymous",
              );
              const displayName = anonymous
                ? "Анонимный участник"
                : (person?.displayName ?? "Участник");
              return (
                <article className="rounded-2xl bg-[#fbf9fe] p-3" key={comment.id}>
                  <div className="flex items-center gap-2">
                    {person && !anonymous ? (
                      <PersonAvatar person={person} size="size-7" />
                    ) : (
                      <span className="grid size-7 place-items-center rounded-full bg-[#eee7f4] text-[9px] font-black text-[#756a7d]">
                        ?
                      </span>
                    )}
                    <span className="min-w-0 grow">
                      <b className="block truncate text-[10px]">{displayName}</b>
                      <small className="block text-[8px] text-[#93869d]">
                        {new Intl.DateTimeFormat("ru-RU", {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(comment.created_at))}
                      </small>
                    </span>
                    {comment.support_id && (
                      <span className="rounded-full bg-[#fff6e8] px-2 py-1 text-[8px] font-black text-[#9a7a20]">
                        Поддержка
                      </span>
                    )}
                    {user &&
                      comment.display_author_id &&
                      comment.display_author_id !== user.id && (
                        <ReportForm
                          returnTo={`/fundraisers/${fundraiser.slug}#discussion`}
                          targetId={comment.id}
                          targetType="comment"
                        />
                      )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-[#5f5369]">
                    {comment.body}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
