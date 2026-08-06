import Link from "next/link";
import type { Metadata, Route } from "next";
/* eslint-disable @next/next/no-img-element -- avatars and wish media use signed Storage URLs */
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { promoteWishWithBonus } from "@/app/bonuses/actions";
import { FeedWishToggle } from "@/components/feed-wish-toggle";
import { LiveWishDiscussionRefresh } from "@/components/live-wish-discussion-refresh";
import { ReportForm } from "@/components/report-form";
import { WishCategoryIcon } from "@/components/wish-category-icon";
import { cloneWish, postWishComment } from "@/app/wishes/actions";
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
    openGraph: {
      title: `${wish.title} — «Хочу также»`,
      description,
      type: "article",
      images: [
        {
          url: `/og?type=wish&title=${encodeURIComponent(wish.title)}&subtitle=${encodeURIComponent(description.slice(0, 160))}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

type CommentRow = {
  id: string;
  author_id: string;
  body: string;
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
          <img alt="" className="size-full object-cover" src={person.avatarUrl} />
        ) : (
          person.displayName.slice(0, 1).toUpperCase()
        )}
      </span>
    </span>
  );
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
  const isAuthor = user?.id === wish.author_id;
  const { data: existingAlsoWant } =
    user && !isAuthor
      ? await supabase
          .from("wish_also_wants")
          .select("wish_id")
          .eq("wish_id", wish.id)
          .eq("profile_id", user.id)
          .maybeSingle()
      : { data: null };

  const [{ data: rawAuthor }, { data: comments }, { data: alsoWanters }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_path, city, show_city")
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
        .limit(8),
    ]);

  const profileIds = [
    ...new Set(
      [
        ...(comments ?? []).map((comment) => comment.author_id),
        ...(alsoWanters ?? []).map((item) => item.profile_id),
        rawAuthor?.id ?? "",
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
  const imageUrl = await getSignedImageUrl({
    bucket: "wish-media",
    path: wish.image_path,
  });
  const category =
    CATEGORIES.find((item) => item.slug === wish.category_slug) ?? CATEGORIES.at(-1)!;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к желаниям"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href={author ? (`/u/${author.username}` as Route) : "/wishes"}
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Хочу также
          </small>
          <h1 className="mt-0.5 text-sm font-black">Желание</h1>
        </span>
        {user && !isAuthor ? (
          <ReportForm
            returnTo={`/wishes/${wish.id}`}
            targetId={wish.id}
            targetType="wish"
          />
        ) : (
          <span className="w-10" />
        )}
      </header>

      <article className="border-[#2c2036]/9 mt-5 overflow-hidden rounded-[1.8rem] border bg-white p-4 shadow-[0_14px_32px_rgba(69,43,94,.08)]">
        <div className="flex items-start gap-4">
          <span className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#f3e8ff] to-[#fff0f6] text-[#8753e6]">
            {imageUrl ? (
              <img alt="" className="size-full object-cover" src={imageUrl} />
            ) : (
              <WishCategoryIcon category={wish.category_slug} className="size-10" />
            )}
          </span>
          <span className="min-w-0 grow">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0e9ff] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#7549d0]">
              <WishCategoryIcon category={wish.category_slug} className="size-3" />{" "}
              {category.label}
            </span>
            <h2 className="mt-3 text-xl font-black leading-[0.95] tracking-[-0.055em]">
              {wish.title}
            </h2>
            {wish.estimated_cost_minor && (
              <span className="mt-3 inline-flex rounded-full bg-[#fff6e8] px-2 py-1 text-[9px] font-black text-[#9a7a52]">
                ~ {formatRubles(wish.estimated_cost_minor)}
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
                <span>Автор желания</span>
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

        {wish.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#5f5369]">
            {wish.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {user && !isAuthor ? (
            <FeedWishToggle
              initialActive={Boolean(existingAlsoWant)}
              initialCount={wish.also_wants_count ?? 0}
              size="prominent"
              wishId={wish.id}
            />
          ) : !user ? (
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 text-xs font-black text-white"
              href="/auth/sign-in"
            >
              <Heart className="size-4" /> Хочу также
            </Link>
          ) : (
            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#f0e9ff] px-4 text-xs font-black text-[#7549d0]">
              <Heart className="size-4" /> {wish.also_wants_count ?? 0} хотят также
            </span>
          )}
          {user && !isAuthor && (
            <form action={cloneWish}>
              <input name="source_wish_id" type="hidden" value={wish.id} />
              <button
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dfd5e5] bg-white px-3.5 text-xs font-black text-[#665a72]"
                type="submit"
              >
                <Plus className="size-3.5" /> В мой список
              </button>
            </form>
          )}
          {wish.product_url && (
            <a
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dfd5e5] bg-white px-3.5 text-xs font-black text-[#665a72]"
              href={wish.product_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-3.5" /> Смотреть
            </a>
          )}
        </div>
      </article>

      {isAuthor && (
        <section className="mt-4 rounded-[1.5rem] border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-white text-[#8753e6]">
              <Sparkles className="size-4" />
            </span>
            <span className="grow">
              <b className="block text-xs">Это твоя история</b>
              <small className="mt-1 block text-[10px] leading-4 text-[#756a7d]">
                Желание можно оставить личным, обсуждать с людьми или позже отдельно
                превратить в сбор.
              </small>
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[10px] font-black text-[#7549d0]"
              href={`/wishes/${wish.id}/edit` as Route}
            >
              <Pencil className="size-3.5" /> Редактировать
            </Link>
            <form action={promoteWishWithBonus}>
              <input name="wish_id" type="hidden" value={wish.id} />
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2d4a7] bg-[#fff9e9] px-3 py-2 text-[10px] font-black text-[#9a7a20]"
                type="submit"
              >
                <Sparkles className="size-3.5" /> Показать выше · 500 ⭐
              </button>
            </form>
            <Link
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5e7dc] bg-[#f0faf5] px-3 py-2 text-[10px] font-black text-[#258b82]"
              href="/fundraisers/new"
            >
              Создать сбор
            </Link>
          </div>
        </section>
      )}

      {alsoWanters && alsoWanters.length > 0 && (
        <section className="border-[#2c2036]/9 mt-5 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center justify-between">
            <span>
              <h2 className="flex items-center gap-2 text-sm font-black">
                <UsersRound className="size-4 text-[#8753e6]" /> Хотят также
              </h2>
              <p className="mt-0.5 text-[10px] text-[#82758a]">
                Люди с похожей историей
              </p>
            </span>
            <span className="rounded-full bg-[#f0e9ff] px-2 py-1 text-[9px] font-black text-[#7549d0]">
              {wish.also_wants_count ?? alsoWanters.length}
            </span>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {alsoWanters
              .flatMap((item) => {
                const person = people.get(item.profile_id);
                return person ? [person] : [];
              })
              .map((person) => (
                <Link
                  className="flex w-14 shrink-0 flex-col items-center gap-1"
                  href={`/u/${person.username}` as Route}
                  key={person.id}
                >
                  <PersonAvatar person={person} size="size-10" />
                  <span className="w-14 truncate text-center text-[9px] font-bold">
                    {person.displayName}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      )}

      <section
        className="border-[#2c2036]/9 mt-5 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
        id="discussion"
      >
        <LiveWishDiscussionRefresh wishId={wish.id} />
        <div className="flex items-center justify-between">
          <span>
            <h2 className="flex items-center gap-2 text-sm font-black">
              <MessageCircle className="size-4 text-[#8753e6]" /> Обсуждение
            </h2>
            <p className="mt-0.5 text-[10px] text-[#82758a]">Мысли, идеи и поддержка</p>
          </span>
          <ShieldCheck className="size-4 text-[#258b82]" />
        </div>
        {user ? (
          <form action={postWishComment} className="mt-4">
            <input name="wish_id" type="hidden" value={wish.id} />
            <textarea
              className="min-h-24 w-full resize-none rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-3 text-sm leading-5 outline-none placeholder:text-[#aaa0ae] focus:border-[#b28be8]"
              id="wish-comment-body"
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
          <p className="mt-4 rounded-xl bg-[#fbf9fe] px-3 py-3 text-[10px] leading-4 text-[#756a7d]">
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
              const person = people.get(comment.author_id);
              return (
                <article className="rounded-2xl bg-[#fbf9fe] p-3" key={comment.id}>
                  <div className="flex items-center gap-2">
                    {person ? (
                      <PersonAvatar person={person} size="size-7" />
                    ) : (
                      <span className="grid size-7 place-items-center rounded-full bg-[#eee7f4] text-[9px] font-black text-[#756a7d]">
                        ?
                      </span>
                    )}
                    <span className="min-w-0 grow">
                      <b className="block truncate text-[10px]">
                        {comment.author_id === user?.id
                          ? "Ты"
                          : (person?.displayName ?? "Участник")}
                      </b>
                      <small className="block text-[8px] text-[#93869d]">
                        {new Intl.DateTimeFormat("ru-RU", {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(comment.created_at))}
                      </small>
                    </span>
                    {user && comment.author_id !== user.id && (
                      <ReportForm
                        returnTo={`/wishes/${wish.id}#discussion`}
                        targetId={comment.id}
                        targetType="wish_comment"
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
