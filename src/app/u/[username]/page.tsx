import Link from "next/link";
import type { Metadata, Route } from "next";
/* eslint-disable @next/next/no-img-element -- profile and story media use signed Storage URLs */
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  Gem,
  Gift,
  Gamepad2,
  MapPin,
  MessageCircle,
  MonitorPlay,
  MoreHorizontal,
  Phone,
  Play,
  QrCode,
  Radio,
  Rocket,
  ShieldAlert,
  Sparkles,
  Store,
  Star,
  Trophy,
  UsersRound,
  Video,
} from "lucide-react";
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
import { BrandGiftIcon } from "@/components/brand-gift-icon";
import { CreatorArtifactRequestButton } from "@/components/creator-artifact-request-button";
import { AnimatedArtifact } from "@/components/animated-artifact";
import { CreatorShareLink } from "@/components/creator-share-link";
import { LocalRoleIcon } from "@/components/local-role-icon";
import { ServiceCategoryIcon } from "@/components/service-category-icon";
import { SERVICE_CATEGORIES, SERVICE_KIND_LABELS } from "@/lib/service-categories";
import { CollectibleArtifactGiftButton } from "@/components/collectible-artifact-gift-button";
import { WishCategoryIcon } from "@/components/wish-category-icon";
import { ProfileQrCode } from "@/components/profile-qr-code";
import { ReportForm } from "@/components/report-form";
import { CATEGORIES } from "@/lib/constants";
import { ReasonIcon } from "@/components/gift-icons";
import { reasonLabel } from "@/lib/gift-reasons";
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
    { data: rawArtifactCatalog },
    { data: rawArtifactShelf },
    { data: equippedItems },
    { data: rawServices },
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
    isOwnProfile
      ? supabase
          .from("wishes")
          .select("id, title, category_slug, visibility")
          .eq("author_id", profile.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
          .limit(4)
      : supabase
          .from("wishes")
          .select("id, title, category_slug, visibility")
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
    user && !isOwnProfile
      ? supabase
          .from("collectible_artifact_series")
          .select(
            "id, title, artwork_path, collection_slug, rarity, remaining_edition, total_edition, price_stars",
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("public_collectible_artifact_shelf")
      .select(
        "id, serial_number, issued_at, series_slug, title, artwork_path, rarity, total_edition, reason",
      )
      .eq("recipient_id", profile.id)
      .order("issued_at", { ascending: false })
      .limit(9),
    supabase
      .from("user_inventory")
      .select("item_id, virtual_items!inner(id, item_type, icon_code, name)")
      .eq("profile_id", profile.id)
      .eq("is_equipped", true),
    supabase
      .from("public_city_services")
      .select("id, kind, title, category_slug, description, contact_text")
      .eq("owner_id", profile.id)
      .limit(3),
  ]);

  const profileServices = (rawServices ?? []) as Array<{
    id: string;
    kind: "service" | "business";
    title: string;
    category_slug: string;
    description: string | null;
    contact_text: string | null;
  }>;

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
  const { data: cityRank } =
    profile.city_id && profile.show_city
      ? await supabase
          .from("public_city_rankings")
          .select("rank")
          .eq("city_id", profile.city_id)
          .eq("category", "top")
          .eq("profile_id", profile.id)
          .maybeSingle()
      : { data: null };
  const cityRankData = cityRank as { rank: number } | null;
  const { data: repRoles } = await supabase.rpc("reputation_roles", {
    p_profile_id: profile.id,
  });
  const reputationRoles = (repRoles ?? []) as string[];
  const { data: cityAmbassadorCity } = await supabase.rpc("city_ambassador_badge", {
    p_profile_id: profile.id,
  });
  const { data: localCreator } = await supabase
    .from("public_local_creators")
    .select(
      "role_code, city_label, headline, live_slug, live_title, story_id, event_id, event_title",
    )
    .eq("id", profile.id)
    .maybeSingle();
  const level = {
    star: { label: "Звезда", color: "border-[#d9c5f3] bg-[#f5efff] text-[#7954c7]" },
    author: { label: "Автор", color: "border-[#c7ddf7] bg-[#eff7ff] text-[#4b69a8]" },
    popular: {
      label: "Заметный",
      color: "border-[#f2cbdc] bg-[#fff2f7] text-[#c75883]",
    },
    active: {
      label: "Активный",
      color: "border-[#c5e7dc] bg-[#effaf5] text-[#258b82]",
    },
    novice: { label: "Новичок", color: "border-[#e2d9e8] bg-[#faf7fc] text-[#756a7d]" },
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
  const receivedGifts = (rawReceivedGifts ?? []) as Array<{
    sender_id: string;
    gift_code: string;
    price_stars: number;
    created_at: string;
  }>;
  const equipped = (
    (equippedItems ?? []) as Array<{
      item_id: string;
      virtual_items: Array<{
        id: string;
        item_type: string;
        icon_code: string | null;
        name: string;
      }>;
    }>
  ).flatMap((row) =>
    row.virtual_items?.[0]
      ? [
          {
            itemType: row.virtual_items[0].item_type,
            iconCode: row.virtual_items[0].icon_code,
          },
        ]
      : [],
  );
  const avatarFrame = equipped.find((item) => item.itemType === "avatar_frame");
  const profileTheme = equipped.find((item) => item.itemType === "profile_theme");
  const equippedBadges = equipped.filter((item) => item.itemType === "badge");

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] pb-24 pt-4 text-[#251d31]">
      <header className="flex items-center justify-between px-4">
        <Link
          aria-label="Вернуться к людям"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/people"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            {profile.show_city && profile.city ? profile.city : "Профиль"}
          </small>
          <b className="mt-0.5 block text-sm">Своя история</b>
        </span>
        <div className="flex items-center gap-2">
          {user && !isOwnProfile && (
            <ReportForm
              returnTo={`/u/${profile.username}`}
              targetId={profile.id}
              targetType="profile"
            />
          )}
          <span className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#74677d] shadow-[0_5px_15px_rgba(69,43,94,.05)]">
            <MoreHorizontal className="size-4.5" />
          </span>
        </div>
      </header>

      <section
        className={`mx-4 mt-5 overflow-hidden rounded-[1.85rem] border border-white/70 p-5 shadow-[0_14px_32px_rgba(69,43,94,.09)] ${
          profileTheme
            ? "bg-gradient-to-br from-[#e7edff] via-[#f8f4ff] to-[#fff0f7]"
            : "bg-gradient-to-br from-[#f7ebff] via-[#fff8fc] to-[#eaf6ff]"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <span
            className={`grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] p-0.5 text-2xl font-black text-[#372c41] ${
              avatarFrame ? "shadow-[0_0_0_4px_rgba(179,125,239,.22)]" : ""
            }`}
          >
            <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f8f4fc]">
              {avatarUrl ? (
                <img
                  loading="lazy"
                  decoding="async"
                  alt={`Аватар ${profile.display_name}`}
                  className="size-full object-cover"
                  src={avatarUrl}
                />
              ) : (
                profile.display_name.slice(0, 1).toUpperCase()
              )}
            </span>
          </span>
          {user && !isOwnProfile ? (
            <div className="flex flex-wrap justify-end gap-2">
              {rawArtifactCatalog &&
                rawArtifactCatalog.length > 0 &&
                (profile.is_creator ? (
                  <CreatorArtifactRequestButton
                    artifacts={rawArtifactCatalog.map((artifact) => ({
                      id: artifact.id,
                      title: artifact.title,
                      artworkPath: artifact.artwork_path,
                      collectionSlug: artifact.collection_slug,
                      remainingEdition: artifact.remaining_edition,
                      totalEdition: artifact.total_edition,
                      priceStars: artifact.price_stars,
                    }))}
                    creatorId={profile.id}
                    username={profile.username}
                  />
                ) : (
                  <CollectibleArtifactGiftButton
                    artifacts={rawArtifactCatalog.map((artifact) => ({
                      id: artifact.id,
                      title: artifact.title,
                      artworkPath: artifact.artwork_path,
                      collectionSlug: artifact.collection_slug,
                      rarity: artifact.rarity,
                      remainingEdition: artifact.remaining_edition,
                      totalEdition: artifact.total_edition,
                      priceStars: artifact.price_stars,
                    }))}
                    recipientId={profile.id}
                    username={profile.username}
                  />
                ))}
              <form action={toggleUserFollow}>
                <input name="profile_id" type="hidden" value={profile.id} />
                <input name="username" type="hidden" value={profile.username} />
                <button
                  className={`h-10 rounded-xl px-3.5 text-xs font-black shadow-[0_5px_12px_rgba(69,43,94,.08)] ${
                    existingFollow
                      ? "border border-[#d9cde3] bg-white text-[#665a72]"
                      : "bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] text-white"
                  }`}
                  type="submit"
                >
                  {existingFollow ? "Ты подписан(а)" : "Подписаться"}
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
                  aria-label={existingBlock ? "Разблокировать" : "Заблокировать"}
                  className="grid size-10 place-items-center rounded-xl border border-[#ddcfdf] bg-white text-[#806d7f]"
                  type="submit"
                >
                  <ShieldAlert className="size-4" />
                </button>
              </form>
            </div>
          ) : isOwnProfile && !profile.is_creator ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-3.5 text-xs font-black text-white shadow-[0_5px_12px_rgba(160,75,213,.2)]"
              href="/creator/start"
            >
              <Sparkles className="size-4" /> Начать создавать
            </Link>
          ) : null}
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-[-0.055em]">
              {profile.display_name}
            </h1>
            {profile.is_creator && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f0e9ff] px-2 py-1 text-[9px] font-black text-[#7549d0]">
                <Sparkles className="size-3" /> Автор
              </span>
            )}
            {vipActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d8] px-2 py-1 text-[9px] font-black text-[#a87511]">
                <Crown className="size-3" /> VIP
              </span>
            )}
            <span
              className={`rounded-full border px-2 py-1 text-[9px] font-black ${level.color}`}
            >
              {level.label}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#756a7d]">
            <span>@{profile.username}</span>
            {profile.show_city && profile.city && (
              <>
                <span className="size-1 rounded-full bg-[#b0a5b7]" />
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {profile.city}
                </span>
              </>
            )}
          </p>
          <p className="mt-4 max-w-[22rem] text-sm leading-6 text-[#5f5369]">
            {profile.creator_headline ??
              profile.bio ??
              "Собираю свою историю и своих людей в «Хочу также»."}
          </p>
        </div>

        {activeLive && (
          <Link
            className="mt-4 flex items-center gap-3 rounded-2xl bg-white/75 p-3 text-[#5d4c6b] shadow-[0_5px_14px_rgba(69,43,94,.06)]"
            href={`/live/${activeLive.slug}` as Route}
          >
            <span className="grid size-8 place-items-center rounded-xl bg-[#ff4d78] text-white">
              <Radio className="size-4" />
            </span>
            <span className="min-w-0 grow">
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#d84b81]">
                <span className="size-1.5 animate-pulse rounded-full bg-[#ff4d78]" /> В
                эфире
              </span>
              <b className="mt-0.5 block truncate text-[11px]">{activeLive.title}</b>
            </span>
            <ChevronRight className="size-4 shrink-0 text-[#9d90a4]" />
          </Link>
        )}

        {interests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {interests.map((item) => (
              <span
                className="rounded-full border border-[#dfd5e5] bg-white/75 px-2.5 py-1 text-[9px] font-bold text-[#6d6077]"
                key={item.slug}
              >
                {item.label}
              </span>
            ))}
          </div>
        )}

        {(isCityChampion || cityAmbassadorCity || equippedBadges.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {isCityChampion && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d8] px-2.5 py-1 text-[9px] font-black text-[#a87511]">
                <Trophy className="size-3" /> Чемпион города
              </span>
            )}
            {cityAmbassadorCity && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#effaf5] px-2.5 py-1 text-[9px] font-black text-[#258b82]">
                <UsersRound className="size-3" /> Первая волна
              </span>
            )}
            {equippedBadges.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black text-[#7549d0]">
                <Sparkles className="size-3" /> Коллекция {equippedBadges.length}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="border-[#2c2036]/9 mx-4 mt-4 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        {localCreator && (
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
              <LocalRoleIcon className="size-5" code={localCreator.role_code} />
            </span>
            <span className="min-w-0 grow">
              <span className="text-[9px] font-black uppercase tracking-[0.11em] text-[#8753e6]">
                Создаёт в {profile.city ?? "городе"}
              </span>
              <b className="mt-0.5 block text-sm">
                {localCreator.city_label ??
                  localCreator.headline ??
                  "Показывает себя и свои идеи среди своих"}
              </b>
              {(localCreator.live_slug ||
                localCreator.story_id ||
                localCreator.event_id) && (
                <Link
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-[#7549d0]"
                  href={
                    localCreator.live_slug
                      ? (`/live/${localCreator.live_slug}` as Route)
                      : localCreator.story_id
                        ? (`/stories/${localCreator.story_id}` as Route)
                        : (`/events/${localCreator.event_id}` as Route)
                  }
                >
                  {localCreator.live_slug
                    ? "Сейчас в эфире"
                    : localCreator.story_id
                      ? "Новая story"
                      : `Событие: ${localCreator.event_title ?? "открыть"}`}
                  <ChevronRight className="size-3.5" />
                </Link>
              )}
            </span>
          </div>
        )}
        <div
          className={`${localCreator ? "border-[#2c2036]/8 mt-4 border-t pt-4" : ""} flex gap-7 text-center`}
        >
          <span>
            <b className="block text-lg">{followerCount}</b>
            <small className="text-[10px] text-[#766b80]">Подписчики</small>
          </span>
          <span>
            <b className="block text-lg">{rawWishes?.length ?? 0}</b>
            <small className="text-[10px] text-[#766b80]">Желания</small>
          </span>
          <span>
            <b className="block text-lg">{media.length}</b>
            <small className="text-[10px] text-[#766b80]">Фото</small>
          </span>
        </div>
      </section>

      {cityRankData && profile.show_city && (
        <section className="mx-4 mt-4 rounded-[1.55rem] border border-[#e3d4f5] bg-gradient-to-r from-[#fffaff] to-[#f2ecff] p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#8753e6] shadow-[0_4px_12px_rgba(80,45,110,.08)]">
              <Trophy className="size-5" />
            </span>
            <span className="min-w-0 grow">
              <span className="text-[9px] font-black uppercase tracking-[0.11em] text-[#8753e6]">
                Репутация города
              </span>
              <b className="mt-0.5 block text-sm">
                #{cityRankData.rank} в {profile.city ?? "городе"}
              </b>
              <small className="mt-1 block text-[10px] leading-4 text-[#756a7d]">
                Позиция следует за публичной активностью, её нельзя купить.
              </small>
            </span>
          </div>
          {reputationRoles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {reputationRoles.map((role) => (
                <span
                  className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#6d5c7a]"
                  key={role}
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {profileServices.length > 0 && (
        <section className="border-[#2c2036]/9 mx-4 mt-4 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-[#fff6e8] text-[#a87511]">
                <Store className="size-4" />
              </span>
              <span>
                <h2 className="text-sm font-black">Услуги и заведения</h2>
                <p className="mt-0.5 text-[10px] text-[#81748a]">
                  {isOwnProfile
                    ? "Твоя витрина в городе"
                    : "Что человек предлагает городу"}
                </p>
              </span>
            </span>
            <Link className="text-[10px] font-black text-[#8753e6]" href="/services">
              Витрина ›
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {profileServices.map((service) => (
              <Link
                className="flex items-center gap-3 rounded-xl bg-[#fbf9fe] p-2.5"
                href={`/services/${service.id}` as Route}
                key={service.id}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
                  <ServiceCategoryIcon
                    className="size-4"
                    code={
                      SERVICE_CATEGORIES.find(
                        (category) => category.slug === service.category_slug,
                      )?.iconCode
                    }
                  />
                </span>
                <span className="min-w-0 grow">
                  <b className="block truncate text-[11px]">{service.title}</b>
                  <small className="mt-0.5 flex items-center gap-1.5 truncate text-[9px] font-bold text-[#a093a6]">
                    <Sparkles className="size-3 shrink-0 text-[#8753e6]" />
                    {SERVICE_KIND_LABELS[service.kind]}
                    {service.contact_text ? ` · ${service.contact_text}` : ""}
                  </small>
                </span>
                <ChevronRight className="size-4 shrink-0 text-[#a295a8]" />
              </Link>
            ))}
          </div>
          {isOwnProfile && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                className="block rounded-xl border border-dashed border-[#e0cf9f] py-2.5 text-center text-[10px] font-black text-[#a87511]"
                href="/services/new"
              >
                + Добавить
              </Link>
              <Link
                className="block rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] py-2.5 text-center text-[10px] font-black text-[#7549d0]"
                href="/services/mine"
              >
                Моя витрина
              </Link>
            </div>
          )}
        </section>
      )}

      {receivedGifts.length > 0 && (
        <section className="border-[#2c2036]/9 mx-4 mt-4 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#fff0f6] text-[#d84b81]">
              <Gift className="size-4" />
            </span>
            <h2 className="text-xs font-black">Подарки</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {receivedGifts.slice(0, 10).map((gift, index) => (
              <span
                className="grid size-10 place-items-center rounded-xl border border-[#eadfeb] bg-[#fbf8fd] text-[#8753e6]"
                key={`${gift.gift_code}-${index}`}
                title={`${gift.price_stars} Хочу-бонусов`}
              >
                <BrandGiftIcon className="size-5" code={gift.gift_code} />
              </span>
            ))}
            {receivedGifts.length > 10 && (
              <span className="grid size-10 place-items-center rounded-xl bg-[#f3eef7] text-[10px] font-black text-[#756a7d]">
                +{receivedGifts.length - 10}
              </span>
            )}
          </div>
        </section>
      )}

      {rawWishes && rawWishes.length > 0 && (
        <section className="border-[#2c2036]/9 mx-4 mt-4 rounded-[1.55rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center justify-between">
            <span>
              <h2 className="text-sm font-black">Желания</h2>
              <p className="mt-0.5 text-[10px] text-[#81748a]">
                {isOwnProfile
                  ? "Твои публичные и личные истории"
                  : "То, что сейчас важно человеку"}
              </p>
            </span>
            <Link
              className="text-[10px] font-black text-[#8753e6]"
              href={
                isOwnProfile
                  ? "/wishes"
                  : (`/wishes?author=${profile.username}` as Route)
              }
            >
              Все ›
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {rawWishes.slice(0, 3).map((wish) => (
              <Link
                className="flex items-center gap-3 rounded-2xl bg-[#fbf9fe] p-2.5 transition hover:bg-[#f5effa]"
                href={
                  isOwnProfile && wish.visibility === "private"
                    ? (`/wishes/${wish.id}/edit` as Route)
                    : (`/wishes/${wish.id}` as Route)
                }
                key={wish.id}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f3e8ff] to-[#fff0f6] text-[#8753e6]">
                  <WishCategoryIcon
                    category={wish.category_slug}
                    className="size-4.5"
                  />
                </span>
                <span className="min-w-0 grow">
                  <b className="block truncate text-[11px]">{wish.title}</b>
                  {isOwnProfile && wish.visibility === "private" && (
                    <small className="mt-0.5 block text-[9px] font-bold text-[#8a7d91]">
                      Только ты
                    </small>
                  )}
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-[#a295a8]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {rawArtifactShelf && rawArtifactShelf.length > 0 && (
        <section className="mx-4 mt-4 rounded-[1.55rem] border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
          <div className="flex items-center justify-between">
            <span>
              <span className="flex items-center gap-2 text-sm font-black">
                <Gem className="size-4 text-[#8753e6]" /> Коллекция
              </span>
              <small className="mt-0.5 block text-[10px] text-[#756a7d]">
                ARTIFACTS 01
              </small>
            </span>
            {isOwnProfile && (
              <Link
                className="text-[10px] font-black text-[#8753e6]"
                href="/collection"
              >
                Моя полка ›
              </Link>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {rawArtifactShelf.map((artifact) => (
              <span
                className="overflow-hidden rounded-xl border border-white/80 bg-white shadow-[0_4px_12px_rgba(69,43,94,.05)]"
                key={artifact.id}
              >
                <AnimatedArtifact
                  className="aspect-square w-full"
                  orbit={artifact.rarity === "iconic"}
                  rarity={artifact.rarity}
                  src={artifact.artwork_path}
                />
                <span className="block p-2">
                  <b className="block truncate text-[9px]">{artifact.title}</b>
                  {reasonLabel(artifact.reason) && (
                    <small className="mt-0.5 flex items-center gap-1 text-[8px] font-bold leading-3 text-[#b8860b]">
                      <ReasonIcon className="size-3" code={artifact.reason} />
                      {reasonLabel(artifact.reason)!.label}
                    </small>
                  )}
                  <small className="mt-0.5 block text-[8px] font-black text-[#8753e6]">
                    #{artifact.serial_number} / {artifact.total_edition}
                  </small>
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      {isOwnProfile && (!rawArtifactShelf || rawArtifactShelf.length === 0) && (
        <Link
          className="mx-4 mt-4 flex items-center gap-3 rounded-[1.55rem] border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
          href="/collection"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[#8753e6] shadow-[0_4px_12px_rgba(80,45,110,.08)]">
            <Gem className="size-5" />
          </span>
          <span className="min-w-0 grow">
            <b className="block text-xs">ARTIFACTS 01</b>
            <span className="mt-1 block text-[10px] leading-4 text-[#756a7d]">
              Светящиеся камни драгоценной серии уже можно посмотреть.
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-[#8753e6]" />
        </Link>
      )}

      {user &&
        !isOwnProfile &&
        profile.subscriptions_enabled &&
        profile.subscription_price_minor && (
          <div className="mx-4 mb-3 rounded-2xl border border-[#ff9ed0]/35 bg-gradient-to-r from-[#fff0f6] to-[#f3edff] p-4">
            <div className="flex items-center justify-between">
              <span>
                <b className="block">Подписка на автора</b>
                <small className="text-xs text-[#766b80]">
                  Закрытые публикации и будущие бонусы
                </small>
              </span>
              <b className="text-[#ffd0eb]">
                {formatRubles(profile.subscription_price_minor)} / мес
              </b>
            </div>
            {existingSubscription ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-[#766b80]">
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
                  className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold text-white"
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
            className="mx-4 mb-5 rounded-2xl border border-[#b550ff]/35 bg-gradient-to-r from-[#f4edff] to-[#fff7fb] p-4"
          >
            <input name="creator_id" type="hidden" value={profile.id} />
            <input name="username" type="hidden" value={profile.username} />
            <div className="flex items-center justify-between">
              <span>
                <b className="block">Написать сообщение</b>
                <small className="text-xs text-[#766b80]">
                  Автор примет или отклонит запрос
                </small>
              </span>
              <b className="text-[#ffd0eb]">
                {formatRubles(profile.paid_message_price_minor)}
              </b>
            </div>
            <textarea
              className="mt-3 min-h-20 w-full rounded-xl border border-[#2c2036]/10 bg-[#f8f4fb] p-3 text-sm"
              maxLength={2000}
              name="body"
              placeholder="Напишите первое сообщение"
              required
            />
            <button
              className="mt-3 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold text-white"
              type="submit"
            >
              Отправить запрос
            </button>
          </form>
        )}

      <nav className="flex border-y border-[#2c2036]/10 text-sm font-semibold">
        {[
          ["about", "Обо мне"],
          ["stories", "Stories"],
          ["posts", "Посты"],
        ].map(([value, label]) => (
          <Link
            className={`flex-1 py-3 text-center ${tab === value ? "border-b-2 border-[#ee4f9d] text-[#7549d0]" : "text-[#766b80]"}`}
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
              className="flex items-center gap-3 rounded-2xl border border-[#ff2d55]/50 bg-gradient-to-r from-[#fff0f6] to-[#f7efff] p-3"
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
              className="flex items-center gap-3 rounded-2xl border border-[#b550ff]/40 bg-gradient-to-r from-[#f4edff] to-[#fff8fc] p-3"
              href={`/stories/${activeStory.id}` as Route}
            >
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#ff4b8a] to-[#7d45ff] text-white">
                <Play className="size-5 fill-white" />
              </span>
              <span className="grow">
                <b className="block text-sm">Новая video story</b>
                <small className="text-xs text-[#766b80]">Доступна сейчас</small>
              </span>
              <span className="text-sm text-[#d8a1ff]">Смотреть ›</span>
            </Link>
          )}
          {rawOffers && rawOffers.length > 0 && (
            <section className="rounded-2xl border border-[#2c2036]/10 bg-white p-4">
              <h2 className="font-bold">Со мной можно</h2>
              <div className="divide-white/8 mt-3 divide-y">
                {rawOffers.map((offer) => {
                  const offerIcons: Record<string, typeof MessageCircle> = {
                    message: MessageCircle,
                    voice_call: Phone,
                    video_call: Video,
                    game: Gamepad2,
                    activity: Sparkles,
                    co_stream: MonitorPlay,
                    custom: Star,
                  };
                  const OfferIcon = offerIcons[offer.kind] ?? Star;
                  return (
                    <div
                      className="flex items-center justify-between py-3"
                      key={offer.id}
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-[#f3ecff] text-[#8753e6]">
                          <OfferIcon className="size-4" />
                        </span>
                        <span>
                          <b className="block text-sm">{offer.title}</b>
                          {offer.description && (
                            <small className="block text-xs text-[#766b80]">
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
                            className="rounded-lg bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-2.5 py-1.5 text-xs font-bold text-white"
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
                className="block rounded-2xl border border-[#2c2036]/10 bg-white p-4"
                href={`/fundraisers/${fundraiser.slug}` as Route}
                key={fundraiser.id}
              >
                <p className="text-xs text-[#766b80]">Активная цель</p>
                <b className="mt-1 block">{fundraiser.title}</b>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee7f4]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] text-white"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#665a72]">
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
                        loading="lazy"
                        decoding="async"
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
              className="flex items-center gap-3 rounded-2xl border border-[#b550ff]/40 bg-gradient-to-r from-[#f4edff] to-[#fff8fc] p-4"
              href={`/stories/${activeStory.id}` as Route}
            >
              <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#ff4b8a] to-[#7d45ff] text-white">
                <Play className="size-6 fill-white" />
              </span>
              <span className="grow">
                <b className="block">Новая video story</b>
                <small className="text-xs text-[#766b80]">Доступна сейчас</small>
              </span>
              <span className="text-[#d8a1ff]">Смотреть ›</span>
            </Link>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#2c2036]/15 p-6 text-center text-sm text-[#aaa2b4]">
              Активных stories пока нет.
            </div>
          )}
        </section>
      )}

      {tab === "posts" && rawPosts && rawPosts.length > 0 && (
        <section className="mx-4 mt-5 space-y-2">
          <p className="text-sm font-bold text-[#54475e]">Посты автора</p>
          {rawPosts.map((post) => (
            <Link
              className="block rounded-2xl border border-[#2c2036]/10 bg-white p-4"
              href={`/posts/${post.slug}` as Route}
              key={post.id}
            >
              <h2 className="font-bold">{post.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#766b80]">
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ffd35e]/40 bg-[#fff6df] py-3 text-sm font-bold text-[#ffd35e]"
              type="submit"
            >
              <Rocket className="size-4" /> Продвинуть профиль за 300 ⭐ (24 часа)
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
        <Link
          className="mx-4 mt-4 flex items-center gap-3 rounded-[1.5rem] border border-[#d9c5f3] bg-gradient-to-r from-[#fffaff] to-[#f3edff] p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]"
          href="/stories/new"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[#8753e6] shadow-[0_4px_12px_rgba(80,45,110,.08)]">
            <Play className="size-4 fill-current" />
          </span>
          <span className="min-w-0 grow">
            <b className="block text-xs">Новая story</b>
            <span className="mt-1 block text-[10px] leading-4 text-[#756a7d]">
              Покажи короткий момент и продолжи свой сюжет в городе.
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-[#8753e6]" />
        </Link>
      )}

      {isOwnProfile && profile.is_creator && (
        <div className="mx-4 mt-5 grid grid-cols-2 gap-3">
          <Link
            className="flex items-center justify-between rounded-2xl border border-[#2c2036]/10 bg-white px-4 py-3 text-sm font-bold"
            href="/creator/earnings"
          >
            <span>Мой доход</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
          <Link
            className="flex items-center justify-between rounded-2xl border border-[#2c2036]/10 bg-white px-4 py-3 text-sm font-bold"
            href="/creator/offer-requests"
          >
            <span>Запросы</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
          <Link
            className="flex items-center justify-between rounded-2xl border border-[#2c2036]/10 bg-white px-4 py-3 text-sm font-bold"
            href="/settings"
          >
            <span>Настройки</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
          <Link
            className="flex items-center justify-between rounded-2xl border border-[#2c2036]/10 bg-white px-4 py-3 text-sm font-bold"
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
            className="flex items-center justify-between rounded-2xl border border-[#2c2036]/10 bg-white px-4 py-3 text-sm font-bold"
            href="/settings"
          >
            <span>Настройки</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
          <Link
            className="mt-3 flex items-center justify-between rounded-2xl border border-[#2c2036]/10 bg-white px-4 py-3 text-sm font-bold"
            href="/profile/media"
          >
            <span>Мои фото</span>
            <span className="text-[#df9cff]">›</span>
          </Link>
        </div>
      )}
      {isOwnProfile && (
        <div className="mx-4 mt-3 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
          <b className="text-sm font-black">Поделиться профилем</b>
          <div className="mt-3 flex flex-col items-center gap-3">
            <Link
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(160,75,213,.24)]"
              href="/invite"
            >
              <QrCode className="size-4" /> Приветствие по QR — покажи телефон
            </Link>
            <CreatorShareLink light username={profile.username} />
            <ProfileQrCode
              name={profile.display_name}
              url={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://hochutakzhe.ru"}/u/${profile.username}`}
            />
          </div>
        </div>
      )}
      {isOwnProfile && profile.is_creator && (
        <details className="mx-4 mt-3 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
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
            <label className="mt-3 block text-sm text-[#665a72]">
              Тестовая цена, ₽
              <input
                className="mt-2 block w-28 rounded-xl border border-[#2c2036]/10 bg-[#f8f4fb] p-2 text-sm"
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
              className="mt-3 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold text-white"
              type="submit"
            >
              Сохранить
            </button>
          </form>
        </details>
      )}
      {isOwnProfile && profile.is_creator && (
        <details className="mx-4 mt-3 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
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
            <label className="mt-3 block text-sm text-[#665a72]">
              Цена в месяц, ₽
              <input
                className="mt-2 block w-28 rounded-xl border border-[#2c2036]/10 bg-[#f8f4fb] p-2 text-sm"
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
              className="mt-3 rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold text-white"
              type="submit"
            >
              Сохранить
            </button>
          </form>
        </details>
      )}
      {isOwnProfile && profile.is_creator && (
        <details className="mx-4 mt-3 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold">
            Добавить действие
          </summary>
          <form action={createCreatorOffer} className="mt-4">
            <input name="username" type="hidden" value={profile.username} />
            <select
              className="w-full rounded-xl border border-[#2c2036]/10 bg-[#f8f4fb] p-3 text-sm"
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
              className="mt-3 w-full rounded-xl border border-[#2c2036]/10 bg-[#f8f4fb] p-3 text-sm"
              maxLength={80}
              name="title"
              placeholder="Например: Поговорить 15 минут"
              required
            />
            <textarea
              className="mt-3 min-h-16 w-full rounded-xl border border-[#2c2036]/10 bg-[#f8f4fb] p-3 text-sm"
              maxLength={300}
              name="description"
              placeholder="Коротко опишите формат"
            />
            <div className="mt-3 flex gap-2">
              <input
                className="w-28 rounded-xl border border-[#2c2036]/10 bg-[#f8f4fb] p-3 text-sm"
                min="1"
                name="price"
                placeholder="299 ₽"
                required
                type="number"
              />
              <button
                className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold text-white"
                type="submit"
              >
                Добавить
              </button>
            </div>
          </form>
        </details>
      )}
      {isOwnProfile && profile.is_creator && (
        <details className="mx-4 mt-3 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold">Создать пост</summary>
          <form action={createCreatorPost} className="mt-4">
            <input name="username" type="hidden" value={profile.username} />
            <input
              className="w-full rounded-xl border border-[#2c2036]/10 bg-[#f8f4fb] p-3 text-sm"
              maxLength={160}
              name="title"
              placeholder="Заголовок поста"
              required
            />
            <textarea
              className="mt-3 min-h-32 w-full rounded-xl border border-[#2c2036]/10 bg-[#f8f4fb] p-3 text-sm"
              maxLength={10000}
              name="body"
              placeholder="Расскажите что-нибудь своей аудитории"
              required
            />
            <div className="mt-3 flex gap-2">
              <select
                className="rounded-xl bg-[#f8f4fb] px-3 text-sm"
                defaultValue="public"
                name="visibility"
              >
                <option value="public">Публично</option>
                <option value="private">Только я</option>
              </select>
              <button
                className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 text-sm font-bold text-white"
                type="submit"
              >
                Опубликовать
              </button>
            </div>
          </form>
        </details>
      )}

      {!isOwnProfile && (
        <section className="mx-4 mt-5 rounded-2xl border border-[#2c2036]/10 bg-white p-4">
          <b className="block text-sm font-black">Поделиться профилем</b>
          <p className="mt-1 text-[10px] leading-4 text-[#81748a]">
            Отправь ссылку — откроется визитка {profile.display_name} в городе.
          </p>
          <div className="mt-3">
            <CreatorShareLink light username={profile.username} />
          </div>
        </section>
      )}
    </main>
  );
}
