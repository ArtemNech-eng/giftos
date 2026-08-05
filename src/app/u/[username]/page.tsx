import Link from "next/link";
import type { Metadata, Route } from "next";
/* eslint-disable @next/next/no-img-element -- profile and story media use signed Storage URLs */
import { ArrowLeft, MoreHorizontal, Play } from "lucide-react";
import { notFound } from "next/navigation";

import { blockUser, unblockUser } from "@/app/safety/actions";
import { toggleUserFollow } from "@/app/social/actions";
import { createCreatorPost } from "@/app/posts/actions";
import {
  createPaidMessageRequest,
  updateMessageRequestSettings,
} from "@/app/creator/messages/actions";
import { createStory } from "@/app/stories/actions";
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
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  if (!hasSupabaseEnvironment()) return { robots: { index: false, follow: false } };
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, creator_headline, profile_visibility")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile || profile.profile_visibility !== "public")
    return { robots: { index: false, follow: false } };

  const description =
    profile.creator_headline ??
    profile.bio ??
    `Страница автора ${profile.display_name} в «Хочу также».`;
  return {
    title: `${profile.display_name} — автор в «Хочу также»`,
    description,
    alternates: { canonical: `/u/${username}` },
    openGraph: {
      title: `${profile.display_name} — «Хочу также»`,
      description,
      type: "profile",
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, city, show_city, avatar_path, is_creator, creator_headline, message_requests_enabled, paid_message_price_minor",
    )
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;
  const [
    { data: existingFollow },
    { data: existingBlock },
    { data: rawMedia },
    { data: rawWishes },
    { data: rawFundraisers },
    { data: rawStories },
    { data: rawPosts },
    { count: followers },
  ] = await Promise.all([
    user && !isOwnProfile
      ? supabase
          .from("user_follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user && !isOwnProfile
      ? supabase
          .from("blocks")
          .select("blocker_id")
          .eq("blocker_id", user.id)
          .eq("blocked_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("profile_media")
      .select("id, storage_path, visibility, sort_order")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("wishes")
      .select("id, title, category_slug")
      .eq("author_id", profile.id)
      .eq("visibility", "public")
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("fundraisers")
      .select(
        "id, slug, title, current_amount_minor, target_amount_minor, category_slug",
      )
      .eq("author_id", profile.id)
      .eq("visibility", "public")
      .in("status", ["active", "goal_reached"])
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("stories")
      .select("id, created_at")
      .eq("author_id", profile.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("creator_posts")
      .select("id, slug, title, body, published_at")
      .eq("author_id", profile.id)
      .eq("visibility", "public")
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
  ]);

  const avatarUrl = await getSignedImageUrl({
    bucket: "avatars",
    path: profile.avatar_path,
  });
  const media = await Promise.all(
    (rawMedia ?? []).map(async (item) => ({
      ...item,
      url: await getSignedImageUrl({
        bucket: "profile-media",
        path: item.storage_path,
      }),
    })),
  );
  const coverUrl = media[0]?.url ?? null;
  const activeStory = rawStories?.[0] ?? null;
  const interests = CATEGORIES.filter((category) =>
    rawWishes?.some((wish) => wish.category_slug === category.slug),
  ).slice(0, 4);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] pb-24 text-white">
      <header className="absolute z-10 flex w-full max-w-[430px] items-center justify-between p-4">
        <Link
          className="grid size-9 place-items-center rounded-full bg-black/35 backdrop-blur"
          href="/"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          {user && !isOwnProfile && (
            <ReportForm
              returnTo={`/u/${profile.username}`}
              targetId={profile.id}
              targetType="profile"
            />
          )}
          <span className="grid size-9 place-items-center rounded-full bg-black/35 backdrop-blur">
            <MoreHorizontal className="size-5" />
          </span>
        </div>
      </header>

      <section className="relative h-64 overflow-hidden bg-gradient-to-br from-[#3b183f] via-[#281831] to-[#171a2a]">
        {coverUrl ? (
          <img alt="" className="size-full object-cover opacity-80" src={coverUrl} />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(236,68,154,0.48),transparent_25%),radial-gradient(circle_at_20%_90%,rgba(113,65,255,0.5),transparent_30%)]" />
        )}
      </section>

      <section className="relative px-4 pb-5">
        <div className="-mt-12 flex items-end justify-between">
          <span className="grid size-24 place-items-center overflow-hidden rounded-[1.6rem] border-4 border-[#0c0e14] bg-[#32203a] text-3xl font-bold">
            {avatarUrl ? (
              <img
                alt={`Аватар ${profile.display_name}`}
                className="size-full object-cover"
                src={avatarUrl}
              />
            ) : (
              profile.display_name.slice(0, 1).toUpperCase()
            )}
          </span>
          {user && !isOwnProfile ? (
            <div className="flex gap-2">
              <form action={toggleUserFollow}>
                <input name="profile_id" type="hidden" value={profile.id} />
                <input name="username" type="hidden" value={profile.username} />
                <button
                  className={`h-10 rounded-xl px-4 text-sm font-bold ${existingFollow ? "border border-white/20 bg-white/5" : "bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff]"}`}
                  type="submit"
                >
                  {existingFollow ? "Вы подписаны" : "Подписаться"}
                </button>
              </form>
              <form action={existingBlock ? unblockUser : blockUser}>
                <input name="blocked_id" type="hidden" value={profile.id} />
                <input
                  name="return_to"
                  type="hidden"
                  value={`/u/${profile.username}`}
                />
                <button
                  className="h-10 rounded-xl border border-white/10 px-3 text-xs text-[#c9c1d2]"
                  type="submit"
                >
                  {existingBlock ? "Разблокировать" : "Блок"}
                </button>
              </form>
            </div>
          ) : isOwnProfile && !profile.is_creator ? (
            <Link
              className="h-10 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
              href="/creator/start"
            >
              Хочу также
            </Link>
          ) : null}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          {profile.is_creator && (
            <span className="rounded-full bg-gradient-to-r from-[#f94d96] to-[#8953ff] px-2 py-1 text-xs font-semibold">
              Автор
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[#b9b1c5]">
          @{profile.username}
          {profile.show_city && profile.city ? ` · ${profile.city}` : ""}
        </p>
        {interests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {interests.map((item) => (
              <span
                className="bg-white/7 rounded-full px-2.5 py-1 text-xs text-[#e3dce9]"
                key={item.slug}
              >
                {item.emoji} {item.label}
              </span>
            ))}
          </div>
        )}
        <p className="mt-4 text-sm leading-6 text-[#ddd6e4]">
          {profile.creator_headline ??
            profile.bio ??
            "Создаю свою страницу в «Хочу также»."}
        </p>
        <div className="mt-5 flex gap-7 text-center">
          <span>
            <b className="block text-lg">{followers ?? 0}</b>
            <small className="text-xs text-[#aaa3b5]">Подписчики</small>
          </span>
          <span>
            <b className="block text-lg">{rawWishes?.length ?? 0}</b>
            <small className="text-xs text-[#aaa3b5]">Желания</small>
          </span>
          <span>
            <b className="block text-lg">{media.length}</b>
            <small className="text-xs text-[#aaa3b5]">Фото</small>
          </span>
        </div>
      </section>

      {user &&
        !isOwnProfile &&
        profile.message_requests_enabled &&
        profile.paid_message_price_minor && (
          <form
            action={createPaidMessageRequest}
            className="mx-4 mb-5 rounded-2xl border border-[#b550ff]/35 bg-gradient-to-r from-[#25152f] to-[#181927] p-4"
          >
            <input name="creator_id" type="hidden" value={profile.id} />
            <input name="username" type="hidden" value={profile.username} />
            <div className="flex items-center justify-between">
              <span>
                <b className="block">Написать сообщение</b>
                <small className="text-xs text-[#b9b1c5]">
                  Автор примет или отклонит запрос
                </small>
              </span>
              <b className="text-[#ffd0eb]">
                {formatRubles(profile.paid_message_price_minor)}
              </b>
            </div>
            <textarea
              className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
              maxLength={2000}
              name="body"
              placeholder="Напишите первое сообщение"
              required
            />
            <button
              className="mt-3 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
              type="submit"
            >
              Отправить запрос
            </button>
          </form>
        )}

      <nav className="flex border-y border-white/10 text-sm font-semibold">
        <span className="flex-1 border-b-2 border-[#ee4f9d] py-3 text-center">
          Обо мне
        </span>
        <span className="flex-1 py-3 text-center text-[#aaa3b5]">Stories</span>
        <span className="flex-1 py-3 text-center text-[#aaa3b5]">Посты</span>
      </nav>

      <section className="space-y-3 p-4">
        {activeStory && (
          <Link
            className="flex items-center gap-3 rounded-2xl border border-[#b550ff]/40 bg-gradient-to-r from-[#23142e] to-[#191827] p-3"
            href={`/stories/${activeStory.id}` as Route}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#ff4b8a] to-[#7d45ff]">
              <Play className="size-5 fill-white" />
            </span>
            <span className="grow">
              <b className="block text-sm">Новая video story</b>
              <small className="text-xs text-[#b9b1c5]">Доступна сейчас</small>
            </span>
            <span className="text-sm text-[#d8a1ff]">Смотреть ›</span>
          </Link>
        )}
        {rawFundraisers?.map((fundraiser) => {
          const progress = Math.min(
            100,
            Math.round(
              (Number(fundraiser.current_amount_minor) /
                Number(fundraiser.target_amount_minor)) *
                100,
            ),
          );
          return (
            <Link
              className="border-white/8 block rounded-2xl border bg-[#181a24] p-4"
              href={`/fundraisers/${fundraiser.slug}` as Route}
              key={fundraiser.id}
            >
              <p className="text-xs text-[#aaa3b5]">Активная цель</p>
              <b className="mt-1 block">{fundraiser.title}</b>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#d8d0e0]">
                {formatRubles(fundraiser.current_amount_minor)} из{" "}
                {formatRubles(fundraiser.target_amount_minor)}
              </p>
            </Link>
          );
        })}
        {media.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {media
              .slice(1)
              .map(
                (item) =>
                  item.url && (
                    <img
                      alt=""
                      className="aspect-square rounded-xl object-cover"
                      key={item.id}
                      src={item.url}
                    />
                  ),
              )}
          </div>
        )}
      </section>

      {rawPosts && rawPosts.length > 0 && (
        <section className="mx-4 mt-5 space-y-2">
          <p className="text-sm font-bold text-[#e5ddea]">Посты автора</p>
          {rawPosts.map((post) => (
            <Link
              className="border-white/8 block rounded-2xl border bg-[#171923] p-4"
              href={`/posts/${post.slug}` as Route}
              key={post.id}
            >
              <h2 className="font-bold">{post.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#b9b1c5]">
                {post.body}
              </p>
            </Link>
          ))}
        </section>
      )}

      {isOwnProfile && profile.is_creator && (
        <details className="mx-4 rounded-2xl border border-white/10 bg-[#171923] p-4">
          <summary className="cursor-pointer text-sm font-bold">
            Создать video story
          </summary>
          <form action={createStory} className="mt-4" encType="multipart/form-data">
            <input name="username" type="hidden" value={profile.username} />
            <input
              accept="video/mp4,video/webm"
              className="block w-full text-sm text-[#c5bdce] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f24d98] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              name="video"
              required
              type="file"
            />
            <textarea
              className="mt-3 min-h-16 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
              maxLength={500}
              name="caption"
              placeholder="Подпись"
            />
            <div className="mt-3 flex gap-2">
              <select
                className="rounded-xl bg-black/20 px-3 text-sm"
                defaultValue="free"
                name="access_type"
              >
                <option value="free">Бесплатно</option>
                <option value="paid">Платно</option>
              </select>
              <input
                className="w-24 rounded-xl bg-black/20 px-3 text-sm"
                name="unlock_price"
                placeholder="49 ₽"
                type="number"
              />
              <button
                className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold"
                type="submit"
              >
                Опубликовать
              </button>
            </div>
          </form>
        </details>
      )}
      {isOwnProfile && profile.is_creator && (
        <Link
          className="mx-4 mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#171923] px-4 py-3 text-sm font-bold"
          href="/creator/earnings"
        >
          <span>Мой доход</span>
          <span className="text-[#df9cff]">Открыть ›</span>
        </Link>
      )}
      {isOwnProfile && profile.is_creator && (
        <details className="mx-4 mt-3 rounded-2xl border border-white/10 bg-[#171923] p-4">
          <summary className="cursor-pointer text-sm font-bold">
            Настроить запросы на сообщения
          </summary>
          <form action={updateMessageRequestSettings} className="mt-4">
            <input name="username" type="hidden" value={profile.username} />
            <label className="flex items-center gap-2 text-sm">
              <input
                defaultChecked={profile.message_requests_enabled}
                name="message_requests_enabled"
                type="checkbox"
              />{" "}
              Принимать платные запросы
            </label>
            <label className="mt-3 block text-sm text-[#c9c1d2]">
              Тестовая цена, ₽
              <input
                className="mt-2 block w-28 rounded-xl border border-white/10 bg-black/20 p-2 text-sm"
                defaultValue={
                  profile.paid_message_price_minor
                    ? Number(profile.paid_message_price_minor) / 100
                    : "49"
                }
                min="1"
                name="paid_message_price"
                type="number"
              />
            </label>
            <button
              className="mt-3 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
              type="submit"
            >
              Сохранить
            </button>
          </form>
        </details>
      )}
      {isOwnProfile && profile.is_creator && (
        <details className="mx-4 mt-3 rounded-2xl border border-white/10 bg-[#171923] p-4">
          <summary className="cursor-pointer text-sm font-bold">Создать пост</summary>
          <form action={createCreatorPost} className="mt-4">
            <input name="username" type="hidden" value={profile.username} />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
              maxLength={160}
              name="title"
              placeholder="Заголовок поста"
              required
            />
            <textarea
              className="mt-3 min-h-32 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
              maxLength={10000}
              name="body"
              placeholder="Расскажите что-нибудь своей аудитории"
              required
            />
            <div className="mt-3 flex gap-2">
              <select
                className="rounded-xl bg-black/20 px-3 text-sm"
                defaultValue="public"
                name="visibility"
              >
                <option value="public">Публично</option>
                <option value="private">Только я</option>
              </select>
              <button
                className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold"
                type="submit"
              >
                Опубликовать
              </button>
            </div>
          </form>
        </details>
      )}
    </main>
  );
}
