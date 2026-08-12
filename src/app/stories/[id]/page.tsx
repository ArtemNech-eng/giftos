/* eslint-disable @next/next/no-img-element -- media and avatars use short-lived signed Storage URLs */
import Link from "next/link";
import type { Route } from "next";
import { Flame, Heart, LockKeyhole, MapPin, Play, Radio, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { sendTestStoryGift } from "@/app/stories/gifts/actions";
import { toggleStoryReaction } from "@/app/stories/reactions/actions";
import { testUnlockStory } from "@/app/stories/actions";
import { BrandGiftIcon } from "@/components/brand-gift-icon";
import { LocalRoleIcon } from "@/components/local-role-icon";
import { ReportForm } from "@/components/report-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRubles } from "@/lib/money";
import { getSignedImageUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Story",
  robots: { index: false, follow: false },
};

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: story } = await supabase
    .from("stories")
    .select(
      "id, author_id, media_path, caption, access_type, unlock_price_minor, currency, expires_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!story || new Date(story.expires_at) <= new Date()) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id === story.author_id;
  if (user && !isAuthor) {
    try {
      await createAdminClient().from("story_views").upsert(
        {
          story_id: story.id,
          viewer_id: user.id,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "story_id,viewer_id" },
      );
    } catch {
      // A story remains viewable if a local test environment has no service key.
    }
  }
  const { data: unlock } =
    user && !isAuthor
      ? await supabase
          .from("story_unlocks")
          .select("status")
          .eq("story_id", story.id)
          .eq("viewer_id", user.id)
          .maybeSingle()
      : { data: null };
  const canWatch =
    story.access_type === "free" || isAuthor || unlock?.status === "unlocked";
  const [{ data: author }, { data: gifts }, { data: storyGifts }, { data: reactions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, display_name, avatar_path, city, city_id, show_city")
        .eq("id", story.author_id)
        .maybeSingle(),
      supabase
        .from("virtual_gifts")
        .select("code, label, emoji, price_minor, currency")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("story_gifts")
        .select("gift_code, price_minor")
        .eq("story_id", story.id),
      supabase
        .from("story_reactions")
        .select("reaction, sender_id")
        .eq("story_id", story.id),
    ]);
  const { data: localCreator } = await supabase
    .from("public_local_creators")
    .select("role_code, city_label, headline, live_slug, event_id")
    .eq("id", story.author_id)
    .maybeSingle();
  const authorAvatarUrl = await getSignedImageUrl({
    bucket: "avatars",
    path: author?.avatar_path,
  });
  const videoUrl = canWatch
    ? await getSignedImageUrl({ bucket: "story-media", path: story.media_path })
    : null;
  const expiry = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(story.expires_at));
  const reactionConfig = [
    { code: "heart", label: "Нравится" },
    { code: "fire", label: "Огонь" },
    { code: "wow", label: "Вау" },
  ];
  const reactionIcon = (code: string) => {
    if (code === "heart") return <Heart className="size-4" />;
    if (code === "fire") return <Flame className="size-4" />;
    return <Sparkles className="size-4" />;
  };
  const reactionCount = (code: string) =>
    reactions?.filter((item) => item.reaction === code).length ?? 0;
  const hasReaction = (code: string) =>
    Boolean(
      user &&
      reactions?.some((item) => item.reaction === code && item.sender_id === user.id),
    );

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] items-center bg-[#f7f4fb] px-3 py-4 text-[#251d31]">
      <section className="w-full overflow-hidden rounded-[1.8rem] border border-[#2c2036]/10 bg-white shadow-[0_20px_65px_rgba(69,43,94,.18)]">
        <div className="relative aspect-[9/16] max-h-[72vh] bg-[#241a2a]">
          {canWatch && videoUrl ? (
            <video
              autoPlay
              className="size-full object-contain"
              controls
              playsInline
              src={videoUrl}
            />
          ) : (
            <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_50%_20%,rgba(176,103,240,.25),transparent_32%),linear-gradient(180deg,#f3ecff,#eaf5ff)] p-6 text-center text-[#251d31]">
              <div>
                <LockKeyhole className="mx-auto size-10 text-[#7549d0]" />
                <h1 className="mt-4 text-xl font-black">Закрытая story</h1>
                <p className="mt-2 text-sm leading-6 text-[#756a7d]">
                  Открой короткое видео автора и поддержи его первые публикации.
                </p>
                {story.unlock_price_minor && (
                  <p className="mt-4 text-2xl font-black">
                    {formatRubles(story.unlock_price_minor)}
                  </p>
                )}
                {user ? (
                  <form action={testUnlockStory} className="mt-5">
                    <input name="story_id" type="hidden" value={story.id} />
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-5 text-sm font-black text-white"
                      type="submit"
                    >
                      <Sparkles className="size-4" /> Открыть в тестовом режиме
                    </button>
                  </form>
                ) : (
                  <Link
                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-5 text-sm font-black text-white"
                    href="/auth/sign-in"
                  >
                    <Play className="size-4" /> Войти и открыть
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 to-transparent px-4 pb-10 pt-4">
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full w-2/3 rounded-full bg-white" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <Link
                className="flex min-w-0 items-center gap-2"
                href={author?.username ? `/u/${author.username}` : "/feed"}
              >
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/45 bg-[#2b1d31] text-xs font-black">
                  {authorAvatarUrl ? (
                    <img
                      loading="lazy"
                      decoding="async"
                      alt=""
                      className="size-full object-cover"
                      src={authorAvatarUrl}
                    />
                  ) : (
                    (author?.display_name ?? "А").slice(0, 1).toUpperCase()
                  )}
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-xs">
                    {author?.display_name ?? "Автор"}
                  </b>
                  <span className="mt-0.5 flex items-center gap-1 text-[9px] text-white/75">
                    {localCreator && (
                      <LocalRoleIcon className="size-3" code={localCreator.role_code} />
                    )}
                    {localCreator?.city_label ??
                      (author?.show_city ? author.city : "Story автора")}
                  </span>
                </span>
              </Link>
              <div className="flex items-center gap-2">
                {isAuthor && (
                  <Link
                    className="rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black"
                    href={`/creator/stories/${story.id}/analytics`}
                  >
                    Аналитика
                  </Link>
                )}
                {user && !isAuthor && (
                  <ReportForm
                    returnTo={`/stories/${story.id}`}
                    targetId={story.id}
                    targetType="story"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-[#7549d0]">
              <Radio className="size-3.5" /> Story до {expiry}
            </span>
            {author?.show_city && author.city && (
              <Link
                className="flex items-center gap-1 text-[10px] font-bold text-[#ff9bc5]"
                href="/places"
              >
                <MapPin className="size-3.5" /> {author.city} сейчас
              </Link>
            )}
          </div>
          {story.caption && (
            <p className="mt-3 text-sm leading-6 text-[#5f5369]">{story.caption}</p>
          )}
          {localCreator && (
            <Link
              className="mt-4 flex items-center gap-2 rounded-xl bg-[#fbf9fe] p-3"
              href={
                localCreator.live_slug
                  ? (`/live/${localCreator.live_slug}` as Route)
                  : localCreator.event_id
                    ? (`/events/${localCreator.event_id}` as Route)
                    : author?.username
                      ? (`/u/${author.username}` as Route)
                      : "/feed"
              }
            >
              <span className="grid size-8 place-items-center rounded-lg bg-[#f0e9ff] text-[#8753e6]">
                <LocalRoleIcon className="size-4" code={localCreator.role_code} />
              </span>
              <span className="min-w-0 grow">
                <b className="block text-[11px] text-[#4e4258]">
                  Создаёт в {author?.city ?? "городе"}
                </b>
                <small className="block truncate text-[10px] text-[#81748a]">
                  {localCreator.headline ?? "Открыть автора"}
                </small>
              </span>
              <span className="text-[#8753e6]">›</span>
            </Link>
          )}
        </section>

        {canWatch && (
          <section className="border-t border-[#f0e8f5] px-4 py-3">
            <div className="flex gap-2">
              {reactionConfig.map((reaction) =>
                user ? (
                  <form action={toggleStoryReaction} key={reaction.code}>
                    <input name="story_id" type="hidden" value={story.id} />
                    <input name="reaction" type="hidden" value={reaction.code} />
                    <button
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${
                        hasReaction(reaction.code)
                          ? "border-[#ff77ba] bg-[#ffe6f0] text-[#d84b81]"
                          : "border-[#2c2036]/10 bg-[#fbf9fe] text-[#5f5369]"
                      }`}
                      type="submit"
                    >
                      {reactionIcon(reaction.code)} {reaction.label}
                      {reactionCount(reaction.code) > 0 && reactionCount(reaction.code)}
                    </button>
                  </form>
                ) : (
                  <Link
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-1.5 text-[10px] font-bold text-[#5f5369]"
                    href="/auth/sign-in"
                    key={reaction.code}
                  >
                    {reactionIcon(reaction.code)} {reaction.label}
                    {reactionCount(reaction.code) > 0 && reactionCount(reaction.code)}
                  </Link>
                ),
              )}
            </div>
          </section>
        )}

        {canWatch && user && !isAuthor && gifts && gifts.length > 0 && (
          <section className="border-t border-[#f0e8f5] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black">Поддержать story</p>
              <span className="text-xs text-[#81748a]">
                {storyGifts?.length ?? 0} подарков
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {gifts.map((gift) => (
                <form action={sendTestStoryGift} key={gift.code}>
                  <input name="story_id" type="hidden" value={story.id} />
                  <input name="gift_code" type="hidden" value={gift.code} />
                  <button
                    className="flex w-full flex-col items-center rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-1 py-2 transition hover:border-[#ff77ba] hover:bg-[#fff0f6]"
                    type="submit"
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#ffe6f0] to-[#f0e9ff] text-[#8753e6]">
                      <BrandGiftIcon className="size-6" code={gift.code} />
                    </span>
                    <span className="mt-1 text-[10px] text-[#5f5369]">
                      {gift.label}
                    </span>
                    <span className="text-[10px] text-[#7549d0]">
                      {formatRubles(gift.price_minor)}
                    </span>
                  </button>
                </form>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-[#8a7d91]">
              Подарки работают в тестовом режиме. Публичный городской момент появится
              только при opt-in участников.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
