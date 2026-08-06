import Link from "next/link";
import type { Metadata, Route } from "next";
/* eslint-disable @next/next/no-img-element -- profile and story media use signed Storage URLs */
import { ArrowLeft, MoreHorizontal, Play, Radio } from "lucide-react";
import { notFound } from "next/navigation";

import { blockUser, unblockUser } from "@/app/safety/actions";
import { toggleUserFollow } from "@/app/social/actions";
import { createCreatorOffer } from "@/app/creator/offers/actions";
import { createCreatorOfferRequest } from "@/app/creator/offers/requests/actions";
import { createCreatorPost } from "@/app/posts/actions";
import {
  createPaidMessageRequest,
  updateMessageRequestSettings,
} from "@/app/creator/messages/actions";
import {
  cancelCreatorSubscription,
  testSubscribeToCreator,
  updateCreatorSubscriptionSettings,
} from "@/app/creator/subscriptions/actions";
import { promoteTarget } from "@/app/shop/actions";
import { createStory } from "@/app/stories/actions";
import { CreatorShareLink } from "@/components/creator-share-link";
import { ProfileGiftButton } from "@/components/profile-gift-button";
import { ProfileQrCode } from "@/components/profile-qr-code";
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
      images: [
        {
          url: `/og?type=profile&title=${encodeURIComponent(profile.display_name)}&subtitle=${encodeURIComponent(description.slice(0, 160))}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ username }, { tab: rawTab }] = await Promise.all([params, searchParams]);
  const tab = rawTab === "stories" || rawTab === "posts" ? rawTab : "about";
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, city, city_id, show_city, avatar_path, is_creator, creator_headline, message_requests_enabled, paid_message_price_minor, subscriptions_enabled, subscription_price_minor, promoted_until",
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
    { data: existingSubscription },
    { data: rawMedia },
    { data: rawWishes },
    { data: rawFundraisers },
    { data: rawStories },
    { data: rawPosts },
    { data: rawOffers },
    { count: followers },
    { data: activeLive },
    { data: vip },
    { data: rawReceivedGifts },
    { data: giftCatalog },
    { data: equippedItems },
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
    user && !isOwnProfile
      ? supabase
          .from("creator_subscriptions")
          .select("id, status, expires_at")
          .eq("creator_id", profile.id)
          .eq("subscriber_id", user.id)
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString())
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
      .from("creator_offers")
      .select("id, kind, title, description, price_minor, currency")
      .eq("creator_id", profile.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(6),
    supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("live_rooms")
      .select("id, slug, title, status")
      .eq("host_id", profile.id)
      .eq("status", "live")
      .eq("visibility", "public")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("vip_subscriptions")
      .select("expires_at, status")
      .eq("profile_id", profile.id)
      .maybeSingle(),
    supabase
      .from("profile_gifts")
      .select("sender_id, gift_code, price_stars, created_at")
      .eq("recipient_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("virtual_gifts")
      .select("code, label, emoji, price_stars, requires_vip")
      .eq("is_active", true)
      .eq("economy", "platform")
      .order("sort_order", { ascending: true }),
    supabase
      .from("user_inventory")
      .select("item_id, virtual_items!inner(id, item_type, emoji, name)")
      .eq("profile_id", profile.id)
      .eq("is_equipped", true),
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

  const vipActive = Boolean(
    vip && vip.status === "active" && new Date(vip.expires_at) > new Date(),
  );
  const followerCount = followers ?? 0;
  const { data: lastCitySeason } = await supabase
    .from("city_seasons")
    .select("winner_city_id")
    .not("winner_city_id", "is", null)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const isCityChampion = Boolean(
    profile.city_id && lastCitySeason?.winner_city_id === profile.city_id,
  );
  const { data: cityRank } = await supabase.rpc("city_rank", {
    p_profile_id: profile.id,
  });
  const cityRankData = (cityRank ?? null) as {
    rank: number;
    city_size: number;
    followers: number;
  } | null;
  const { data: repRoles } = await supabase.rpc("reputation_roles", {
    p_profile_id: profile.id,
  });
  const reputationRoles = (repRoles ?? []) as string[];
  const level = {
    star: { label: "💎 Звезда", color: "text-[#e17dff] border-[#e17dff]/40" },
    author: { label: "🎤 Автор", color: "text-[#7fd8ff] border-[#7fd8ff]/40" },
    popular: { label: "🔥 Популярный", color: "text-[#ff9bc5] border-[#ff9bc5]/40" },
    active: { label: "⭐ Активный", color: "text-[#8df0b4] border-[#8df0b4]/40" },
    novice: { label: "🌱 Новичок", color: "text-[#aaa4b7] border-white/15" },
  }[
    followerCount >= 5000
      ? "star"
      : followerCount >= 500
        ? "author"
        : followerCount >= 50
          ? "popular"
          : followerCount >= 5
            ? "active"
            : "novice"
  ];
  // Progress to the next level (pure activity thresholds).
  const levelThresholds = [5, 50, 500, 5000];
  const currentLevelIndex = levelThresholds.findIndex((t) => followerCount < t);
  const nextThreshold =
    currentLevelIndex >= 0 ? levelThresholds[currentLevelIndex] : null;
  const levelProgress = nextThreshold
    ? Math.min(100, Math.round((followerCount / nextThreshold) * 100))
    : 100;
  const receivedGifts = (rawReceivedGifts ?? []) as Array<{
    sender_id: string;
    gift_code: string;
    price_stars: number;
    created_at: string;
  }>;
  const giftEmoji = new Map((giftCatalog ?? []).map((gift) => [gift.code, gift.emoji]));
  const equipped = (
    (equippedItems ?? []) as Array<{
      item_id: string;
      virtual_items: Array<{
        id: string;
        item_type: string;
        emoji: string;
        name: string;
      }>;
    }>
  ).flatMap((row) =>
    row.virtual_items?.[0]
      ? [
          {
            itemType: row.virtual_items[0].item_type,
            emoji: row.virtual_items[0].emoji,
          },
        ]
      : [],
  );
  const avatarFrame = equipped.find((item) => item.itemType === "avatar_frame");
  const profileTheme = equipped.find((item) => item.itemType === "profile_theme");
  const equippedBadges = equipped.filter((item) => item.itemType === "badge");

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

      <section
        className={`relative h-64 overflow-hidden ${
          profileTheme
            ? "bg-gradient-to-br from-[#0b1e3a] via-[#14255c] to-[#0d1030]"
            : "bg-gradient-to-br from-[#3b183f] via-[#281831] to-[#171a2a]"
        }`}
      >
        {coverUrl ? (
          <img alt="" className="size-full object-cover opacity-80" src={coverUrl} />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(236,68,154,0.48),transparent_25%),radial-gradient(circle_at_20%_90%,rgba(113,65,255,0.5),transparent_30%)]" />
        )}
      </section>

      <section className="relative px-4 pb-5">
        <div className="-mt-12 flex items-end justify-between">
          <span
            className={`grid size-24 place-items-center overflow-hidden rounded-[1.6rem] border-4 bg-[#32203a] text-3xl font-bold ${
              avatarFrame
                ? "border-[#ff77ba] shadow-[0_0_18px_rgba(255,119,186,0.5)]"
                : "border-[#0c0e14]"
            }`}
          >
            {avatarUrl ? (
              <img
                alt={`Аватар ${profile.display_name}`}
                className="size-full object-cover"
                src={avatarUrl}
              />
            ) : (
              profile.display_name.slice(0, 1).toUpperCase()
            )}
            {avatarFrame && (
              <span className="absolute -bottom-1 -right-1 text-xl">
                {avatarFrame.emoji}
              </span>
            )}
          </span>
          {user && !isOwnProfile ? (
            <div className="flex gap-2">
              {giftCatalog && giftCatalog.length > 0 && (
                <ProfileGiftButton
                  gifts={giftCatalog.map((gift) => ({
                    code: gift.code,
                    label: gift.label,
                    emoji: gift.emoji,
                    price_stars: gift.price_stars ?? 0,
                    requires_vip: Boolean(gift.requires_vip),
                  }))}
                  isVip={vipActive}
                  recipientId={profile.id}
                  username={profile.username}
                />
              )}
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
          {vipActive && (
            <span className="rounded-full border border-[#ffd35e]/50 bg-[#2a2215] px-2 py-1 text-xs font-bold text-[#ffd35e]">
              👑 VIP
            </span>
          )}
          <span
            className={`rounded-full border px-2 py-1 text-xs font-semibold ${level.color}`}
          >
            {level.label}
          </span>
          {isCityChampion && (
            <span
              className="rounded-full border border-[#ffd35e]/50 bg-[#2a2215] px-2 py-1 text-xs font-bold text-[#ffd35e]"
              title="Город выиграл сезон битвы городов"
            >
              🏆 Чемпион города
            </span>
          )}
          {equippedBadges.map((badge) => (
            <span
              className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs"
              key={badge.emoji}
              title="Значок из магазина"
            >
              {badge.emoji}
            </span>
          ))}
          {activeLive && (
            <Link
              className="inline-flex items-center gap-1.5 rounded-full bg-[#ff2d55] px-2.5 py-1 text-xs font-bold text-white"
              href={`/live/${activeLive.slug}` as Route}
            >
              <span className="size-1.5 animate-pulse rounded-full bg-white" />В эфире
            </Link>
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
        {cityRankData && profile.show_city && (
          <div className="mt-5 rounded-2xl border border-[#8f48ff]/30 bg-gradient-to-r from-[#1f1631] to-[#171824] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">#{cityRankData.rank} в городе</p>
                <p className="mt-0.5 text-xs text-[#aaa4b7]">
                  {profile.city ?? "Город"} · среди {cityRankData.city_size} жителей
                </p>
              </div>
              <span className="text-xl">🏆</span>
            </div>
            {nextThreshold ? (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff]"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#aaa4b7]">
                  До уровня «{level.label.split(" ")[1] ?? "следующий"}»: ещё{" "}
                  {nextThreshold - followerCount} подписчиков
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#8df0b4]">
                Максимальный уровень — вы звезда!
              </p>
            )}
            {reputationRoles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {reputationRoles.map((role) => (
                  <span
                    className="rounded-full border border-[#ffd35e]/40 bg-[#2a2215] px-2 py-0.5 text-[10px] font-bold text-[#ffd35e]"
                    key={role}
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {receivedGifts.length > 0 && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#171923] p-4">
            <p className="text-sm font-bold">🎁 Подарки</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {receivedGifts.slice(0, 10).map((gift, index) => (
                <span
                  className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-xl"
                  key={`${gift.gift_code}-${index}`}
                  title={`${gift.gift_code} · ${gift.price_stars} ⭐`}
                >
                  {giftEmoji.get(gift.gift_code) ?? "🎁"}
                </span>
              ))}
              {receivedGifts.length > 10 && (
                <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-xs text-[#aaa4b7]">
                  +{receivedGifts.length - 10}
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {user &&
        !isOwnProfile &&
        profile.subscriptions_enabled &&
        profile.subscription_price_minor && (
          <div className="mx-4 mb-3 rounded-2xl border border-[#ff9ed0]/35 bg-gradient-to-r from-[#30182f] to-[#191827] p-4">
            <div className="flex items-center justify-between">
              <span>
                <b className="block">Подписка на автора</b>
                <small className="text-xs text-[#b9b1c5]">
                  Закрытые публикации и будущие бонусы
                </small>
              </span>
              <b className="text-[#ffd0eb]">
                {formatRubles(profile.subscription_price_minor)} / мес
              </b>
            </div>
            {existingSubscription ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-[#b9b1c5]">
                  Активна до{" "}
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(existingSubscription.expires_at))}
                </span>
                <form action={cancelCreatorSubscription}>
                  <input name="creator_id" type="hidden" value={profile.id} />
                  <input name="username" type="hidden" value={profile.username} />
                  <button
                    className="rounded-xl border border-[#ff5b99]/40 px-3 py-1.5 text-xs font-semibold text-[#ff9bc5]"
                    type="submit"
                  >
                    Отменить
                  </button>
                </form>
              </div>
            ) : (
              <form action={testSubscribeToCreator} className="mt-3">
                <input name="creator_id" type="hidden" value={profile.id} />
                <input name="username" type="hidden" value={profile.username} />
                <button
                  className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
                  type="submit"
                >
                  Подписаться в тестовом режиме
                </button>
              </form>
            )}
          </div>
        )}

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
        {[
          ["about", "Обо мне"],
          ["stories", "Stories"],
          ["posts", "Посты"],
        ].map(([value, label]) => (
          <Link
            className={`flex-1 py-3 text-center ${tab === value ? "border-b-2 border-[#ee4f9d] text-white" : "text-[#aaa3b5]"}`}
            href={
              `/u/${profile.username}${value === "about" ? "" : `?tab=${value}`}` as Route
            }
            key={value}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "about" && (
        <section className="space-y-3 p-4">
          {activeLive && (
            <Link
              className="flex items-center gap-3 rounded-2xl border border-[#ff2d55]/50 bg-gradient-to-r from-[#2a1222] to-[#1b1528] p-3"
              href={`/live/${activeLive.slug}` as Route}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ff2d55]">
                <Radio className="size-5 fill-white text-white" />
              </span>
              <span className="min-w-0 grow">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#ff7fb5]">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#ff2d55]" />
                  СЕЙЧАС В ЭФИРЕ
                </span>
                <span className="mt-0.5 block truncate text-sm font-bold">
                  {activeLive.title}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-[#ffb7dd]">
                Смотреть ›
              </span>
            </Link>
          )}
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
          {rawOffers && rawOffers.length > 0 && (
            <section className="border-white/8 rounded-2xl border bg-[#171923] p-4">
              <h2 className="font-bold">Со мной можно</h2>
              <div className="divide-white/8 mt-3 divide-y">
                {rawOffers.map((offer) => {
                  const icons: Record<string, string> = {
                    message: "💬",
                    voice_call: "📞",
                    video_call: "🎥",
                    game: "🎮",
                    activity: "✨",
                    co_stream: "📺",
                    custom: "⭐",
                  };
                  return (
                    <div
                      className="flex items-center justify-between py-3"
                      key={offer.id}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">{icons[offer.kind] ?? "⭐"}</span>
                        <span>
                          <b className="block text-sm">{offer.title}</b>
                          {offer.description && (
                            <small className="block text-xs text-[#a9a1b4]">
                              {offer.description}
                            </small>
                          )}
                        </span>
                      </span>
                      {user && !isOwnProfile ? (
                        <form action={createCreatorOfferRequest}>
                          <input name="offer_id" type="hidden" value={offer.id} />
                          <input
                            name="username"
                            type="hidden"
                            value={profile.username}
                          />
                          <button
                            className="rounded-lg bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-2.5 py-1.5 text-xs font-bold"
                            type="submit"
                          >
                            {formatRubles(offer.price_minor)}
                          </button>
                        </form>
                      ) : (
                        <b className="text-sm text-[#ffd0eb]">
                          {formatRubles(offer.price_minor)}
                        </b>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
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
      )}

      {tab === "stories" && (
        <section className="space-y-3 p-4">
          {activeStory ? (
            <Link
              className="flex items-center gap-3 rounded-2xl border border-[#b550ff]/40 bg-gradient-to-r from-[#23142e] to-[#191827] p-4"
              href={`/stories/${activeStory.id}` as Route}
            >
              <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#ff4b8a] to-[#7d45ff]">
                <Play className="size-6 fill-white" />
              </span>
              <span className="grow">
                <b className="block">Новая video story</b>
                <small className="text-xs text-[#b9b1c5]">Доступна сейчас</small>
              </span>
              <span className="text-[#d8a1ff]">Смотреть ›</span>
            </Link>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-[#aaa2b4]">
              Активных stories пока нет.
            </div>
          )}
        </section>
      )}

      {tab === "posts" && rawPosts && rawPosts.length > 0 && (
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

      {isOwnProfile && (
        <div className="mx-4 mt-3">
          <form action={promoteTarget}>
            <input name="target" type="hidden" value="profile" />
            <input name="target_id" type="hidden" value={profile.id} />
            <input name="return_to" type="hidden" value={`/u/${profile.username}`} />
            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ffd35e]/40 bg-[#2a2215] py-3 text-sm font-bold text-[#ffd35e]"
              type="submit"
            >
              🚀 Продвинуть профиль за 300 ⭐ (24 часа)
            </button>
          </form>
          {profile.promoted_until &&
            new Date(profile.promoted_until).getTime() > Date.now() && (
              <p className="mt-2 text-center text-xs text-[#8df0b4]">
                Профиль продвинут до{" "}
                {new Intl.DateTimeFormat("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(profile.promoted_until))}
              </p>
            )}
        </div>
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
        <div className="mx-4 mt-5 grid grid-cols-2 gap-3">
          <Link
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171923] px-4 py-3 text-sm font-bold"
            href="/creator/earnings"
          >
            <span>Мой доход</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
          <Link
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171923] px-4 py-3 text-sm font-bold"
            href="/creator/offer-requests"
          >
            <span>Запросы</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
          <Link
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171923] px-4 py-3 text-sm font-bold"
            href="/settings"
          >
            <span>Настройки</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
          <Link
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171923] px-4 py-3 text-sm font-bold"
            href="/profile/media"
          >
            <span>Мои фото</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
        </div>
      )}
      {isOwnProfile && !profile.is_creator && (
        <div className="mx-4 mt-5">
          <Link
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171923] px-4 py-3 text-sm font-bold"
            href="/settings"
          >
            <span>Настройки</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
          <Link
            className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-[#171923] px-4 py-3 text-sm font-bold"
            href="/profile/media"
          >
            <span>Мои фото</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
        </div>
      )}
      {isOwnProfile && (
        <details className="mx-4 mt-3 rounded-2xl border border-white/10 bg-[#171923] p-4">
          <summary className="cursor-pointer text-sm font-bold">
            Поделиться профилем
          </summary>
          <div className="mt-4 flex flex-col items-center gap-3">
            <CreatorShareLink username={profile.username} />
            <ProfileQrCode
              name={profile.display_name}
              url={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru"}/u/${profile.username}`}
            />
          </div>
        </details>
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
          <summary className="cursor-pointer text-sm font-bold">
            Настроить подписку автора
          </summary>
          <form action={updateCreatorSubscriptionSettings} className="mt-4">
            <input name="username" type="hidden" value={profile.username} />
            <label className="flex items-center gap-2 text-sm">
              <input
                defaultChecked={profile.subscriptions_enabled}
                name="subscriptions_enabled"
                type="checkbox"
              />{" "}
              Включить тестовую подписку
            </label>
            <label className="mt-3 block text-sm text-[#c9c1d2]">
              Цена в месяц, ₽
              <input
                className="mt-2 block w-28 rounded-xl border border-white/10 bg-black/20 p-2 text-sm"
                defaultValue={
                  profile.subscription_price_minor
                    ? Number(profile.subscription_price_minor) / 100
                    : "99"
                }
                min="1"
                name="subscription_price"
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
          <summary className="cursor-pointer text-sm font-bold">
            Добавить действие
          </summary>
          <form action={createCreatorOffer} className="mt-4">
            <input name="username" type="hidden" value={profile.username} />
            <select
              className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
              defaultValue="message"
              name="kind"
            >
              <option value="message">Сообщение</option>
              <option value="voice_call">Голосовой разговор</option>
              <option value="video_call">Видеозвонок</option>
              <option value="game">Поиграть вместе</option>
              <option value="activity">Совместная активность</option>
              <option value="co_stream">Совместный эфир</option>
              <option value="custom">Другое</option>
            </select>
            <input
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
              maxLength={80}
              name="title"
              placeholder="Например: Поговорить 15 минут"
              required
            />
            <textarea
              className="mt-3 min-h-16 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
              maxLength={300}
              name="description"
              placeholder="Коротко опишите формат"
            />
            <div className="mt-3 flex gap-2">
              <input
                className="w-28 rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
                min="1"
                name="price"
                placeholder="299 ₽"
                required
                type="number"
              />
              <button
                className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold"
                type="submit"
              >
                Добавить
              </button>
            </div>
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
