import Link from "next/link";
import type { Route } from "next";
import {
  Bell,
  CirclePlus,
  Compass,
  Gamepad2,
  MessageCircle,
  MapPin,
  Music2,
  Plane,
  Radio,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { FeedWishToggle } from "@/components/feed-wish-toggle";
import { APP_NAME, CATEGORIES } from "@/lib/constants";
import { formatRubles } from "@/lib/money";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Лента авторов",
  robots: { index: false, follow: false },
};

type Fundraiser = {
  id: string;
  slug: string;
  title: string;
  categorySlug: string | null;
  currentAmountMinor: number;
  targetAmountMinor: number;
  authorName: string;
  authorUsername: string;
};

type StoryAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  storyId?: string;
};

type WishPreview = {
  id: string;
  title: string;
  categorySlug: string | null;
  alsoWantsCount: number;
  authorName: string;
  authorUsername: string;
  userWantsIt: boolean;
};

type LiveRoomPreview = {
  id: string;
  slug: string;
  title: string;
  hostName: string;
  hostUsername: string;
  viewers: number;
};

type RecommendedAuthor = {
  id: string;
  username: string;
  displayName: string;
  headline: string | null;
  followerCount: number;
};

type CityPerson = {
  id: string;
  username: string;
  displayName: string;
  city: string | null;
  isCreator: boolean;
  followers: number;
  isVip?: boolean;
};

const demoAuthors: StoryAuthor[] = [
  { id: "nastya", username: "nastya", displayName: "Настя", avatarPath: null },
  { id: "max", username: "max", displayName: "Макс", avatarPath: null },
  { id: "dima", username: "dima", displayName: "Дима", avatarPath: null },
];

const demoLiveRooms: LiveRoomPreview[] = [
  {
    id: "live-1",
    slug: "live-demo-1",
    title: "Играем и общаемся",
    hostName: "Настя",
    hostUsername: "nastya",
    viewers: 128,
  },
  {
    id: "live-2",
    slug: "live-demo-2",
    title: "Утренний кофе с Максом",
    hostName: "Макс",
    hostUsername: "max",
    viewers: 64,
  },
  {
    id: "live-3",
    slug: "live-demo-3",
    title: "Отвечаю на вопросы",
    hostName: "Дима",
    hostUsername: "dima",
    viewers: 21,
  },
];

const demoCityPeople: CityPerson[] = [
  {
    id: "nastya",
    username: "nastya",
    displayName: "Настя",
    city: "Будённовск",
    isCreator: true,
    followers: 1240,
  },
  {
    id: "max",
    username: "max",
    displayName: "Макс",
    city: "Будённовск",
    isCreator: true,
    followers: 876,
  },
  {
    id: "dima",
    username: "dima",
    displayName: "Дима",
    city: "Будённовск",
    isCreator: false,
    followers: 512,
  },
];

const demoRecommendedAuthors: RecommendedAuthor[] = [
  {
    id: "nastya",
    username: "nastya",
    displayName: "Настя",
    headline: "Играю, общаюсь и публикую stories",
    followerCount: 1240,
  },
  {
    id: "max",
    username: "max",
    displayName: "Макс",
    headline: "Музыка, гитары и живые эфиры",
    followerCount: 876,
  },
  {
    id: "dima",
    username: "dima",
    displayName: "Дима",
    headline: "Путешествия и походы",
    followerCount: 512,
  },
];

const demoNewWishes: WishPreview[] = [
  {
    id: "wish-4",
    title: "Курс по 3D-моделированию",
    categorySlug: "hobbies",
    alsoWantsCount: 42,
    userWantsIt: false,
    authorName: "Кира",
    authorUsername: "kira",
  },
  {
    id: "wish-5",
    title: "Велосипед для города",
    categorySlug: "sport",
    alsoWantsCount: 18,
    userWantsIt: false,
    authorName: "Тимур",
    authorUsername: "timur",
  },
];

const demoWishes: WishPreview[] = [
  {
    id: "wish-1",
    title: "Новый MacBook для видео",
    categorySlug: "electronics",
    alsoWantsCount: 1284,
    userWantsIt: true,
    authorName: "Настя",
    authorUsername: "nastya",
  },
  {
    id: "wish-2",
    title: "Увидеть Японию весной",
    categorySlug: "travel",
    alsoWantsCount: 864,
    userWantsIt: false,
    authorName: "Лиза",
    authorUsername: "liza",
  },
  {
    id: "wish-3",
    title: "Собрать домашнюю студию",
    categorySlug: "music",
    alsoWantsCount: 521,
    userWantsIt: false,
    authorName: "Макс",
    authorUsername: "max",
  },
];

const demoFundraisers: Fundraiser[] = [
  {
    id: "demo-1",
    slug: "demo-1",
    title: "Камера для первых съёмок",
    categorySlug: "hobbies",
    currentAmountMinor: 8750000,
    targetAmountMinor: 15000000,
    authorName: "Настя",
    authorUsername: "nastya",
  },
  {
    id: "demo-2",
    slug: "demo-2",
    title: "Первая электрогитара",
    categorySlug: "music",
    currentAmountMinor: 2840000,
    targetAmountMinor: 6500000,
    authorName: "Макс",
    authorUsername: "max",
  },
  {
    id: "demo-3",
    slug: "demo-3",
    title: "Увидеть цветение сакуры",
    categorySlug: "travel",
    currentAmountMinor: 6320000,
    targetAmountMinor: 18000000,
    authorName: "Лиза",
    authorUsername: "liza",
  },
];

async function buildLiveRooms(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rooms: Array<{ id: string; slug: string; title: string; host_id: string }>,
): Promise<LiveRoomPreview[]> {
  if (rooms.length === 0) return [];
  const hostIds = [...new Set(rooms.map((room) => room.host_id))];
  const [{ data: hostProfiles }, { data: participants }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name").in("id", hostIds),
    supabase
      .from("live_room_participants")
      .select("room_id")
      .in(
        "room_id",
        rooms.map((room) => room.id),
      )
      .is("left_at", null),
  ]);
  const hostById = new Map(
    (hostProfiles ?? []).map((profile) => [profile.id, profile]),
  );
  const viewerCount = new Map<string, number>();
  for (const participant of participants ?? [])
    viewerCount.set(
      participant.room_id,
      (viewerCount.get(participant.room_id) ?? 0) + 1,
    );
  return rooms.flatMap((room) => {
    const host = hostById.get(room.host_id);
    return host
      ? [
          {
            id: room.id,
            slug: room.slug,
            title: room.title,
            hostName: host.display_name,
            hostUsername: host.username,
            viewers: viewerCount.get(room.id) ?? 1,
          },
        ]
      : [];
  });
}

async function getHomeData(scope: "city" | "global" = "global") {
  if (!hasSupabaseEnvironment()) {
    return {
      authors: demoAuthors,
      fundraisers: demoFundraisers,
      wishes: demoWishes,
      newWishes: demoNewWishes,
      growingWishes: demoWishes,
      liveRooms: demoLiveRooms,
      popularFundraisers: demoFundraisers,
      growingFundraisers: demoFundraisers,
      recommendedAuthors: demoRecommendedAuthors,
      personalAuthors: [],
      cityName: "Будённовск",
      cityPeople: scope === "city" ? demoCityPeople : [],
      cityNewcomers: scope === "city" ? demoCityPeople : [],
      cityLiveRooms: scope === "city" ? demoLiveRooms : [],
      cityWishes: scope === "city" ? demoWishes : [],
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [
      { data: rawStories },
      { data: rawFundraisers },
      { data: rawWishes },
      { data: rawNewWishes },
      { data: rawGrowingWishes },
      { data: rawLiveRooms },
      { data: rawPopular },
      { data: rawGrowing },
      { data: rawAuthors },
    ] = await Promise.all([
      supabase
        .from("stories")
        .select("id, author_id, created_at")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("public_fundraiser_feed")
        .select(
          "id, slug, title, category_slug, current_amount_minor, target_amount_minor, author_display_name, author_username",
        )
        .order("published_at", { ascending: false })
        .limit(8),
      supabase
        .from("wishes")
        .select(
          "id, author_id, title, category_slug, also_wants_count, promoted_until, created_at",
        )
        .eq("visibility", "public")
        .eq("is_archived", false)
        .order("promoted_until", { ascending: false, nullsFirst: false })
        .order("also_wants_count", { ascending: false })
        .limit(12),
      supabase
        .from("wishes")
        .select("id, author_id, title, category_slug, also_wants_count, created_at")
        .eq("visibility", "public")
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("public_growing_wishes")
        .select(
          "id, author_id, title, category_slug, also_wants_count, weekly_also_wants",
        )
        .limit(6),
      supabase
        .from("live_rooms")
        .select("id, slug, title, host_id")
        .eq("status", "live")
        .eq("visibility", "public")
        .order("started_at", { ascending: false })
        .limit(10),
      supabase
        .from("public_popular_fundraisers")
        .select(
          "id, slug, title, category_slug, current_amount_minor, target_amount_minor, author_display_name, author_username, activity_score",
        )
        .limit(6),
      supabase
        .from("public_growing_fundraisers")
        .select(
          "id, slug, title, category_slug, current_amount_minor, target_amount_minor, author_display_name, author_username, weekly_supports",
        )
        .limit(6),
      supabase
        .from("public_recommended_authors")
        .select("id, username, display_name, creator_headline, follower_count")
        .limit(6),
    ]);

    const liveRooms = await buildLiveRooms(supabase, rawLiveRooms ?? []);

    const uniqueStoryAuthors = new Map<string, { id: string; author_id: string }>();
    for (const story of rawStories ?? []) {
      if (!uniqueStoryAuthors.has(story.author_id))
        uniqueStoryAuthors.set(story.author_id, story);
    }
    const storyRows = [...uniqueStoryAuthors.values()].slice(0, 8);
    const authorIds = [
      ...new Set([
        ...storyRows.map((story) => story.author_id),
        ...(rawWishes ?? []).map((wish) => wish.author_id),
      ]),
    ];
    const { data: profiles } = authorIds.length
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_path")
          .in("id", authorIds)
      : { data: [] };
    const profileById = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile]),
    );
    const authors: StoryAuthor[] = storyRows.flatMap((story) => {
      const profile = profileById.get(story.author_id);
      return profile
        ? [
            {
              id: profile.id,
              username: profile.username,
              displayName: profile.display_name,
              avatarPath: profile.avatar_path,
              storyId: story.id,
            },
          ]
        : [];
    });

    const mapFundraiser = (item: Record<string, unknown>): Fundraiser => ({
      id: String(item.id),
      slug: String(item.slug),
      title: String(item.title),
      categorySlug: item.category_slug ? String(item.category_slug) : null,
      currentAmountMinor: Number(item.current_amount_minor),
      targetAmountMinor: Number(item.target_amount_minor),
      authorName: String(item.author_display_name),
      authorUsername: String(item.author_username),
    });

    const fundraisers: Fundraiser[] = (
      (rawFundraisers ?? []) as Array<Record<string, unknown>>
    ).map(mapFundraiser);

    const popularFundraisers: Fundraiser[] = (
      (rawPopular ?? []) as Array<Record<string, unknown>>
    ).map(mapFundraiser);

    const growingFundraisers: Fundraiser[] = (
      (rawGrowing ?? []) as Array<Record<string, unknown>>
    ).map(mapFundraiser);

    const recommendedAuthors: RecommendedAuthor[] = (
      (rawAuthors ?? []) as Array<Record<string, unknown>>
    ).map((item) => ({
      id: String(item.id),
      username: String(item.username),
      displayName: String(item.display_name),
      headline: item.creator_headline ? String(item.creator_headline) : null,
      followerCount: Number(item.follower_count),
    }));

    // Personal recommendations: authors sharing the user's interests,
    // excluding people the user already follows. Falls back to the general
    // ranking when the user is anonymous or has no interests.
    let personalAuthors: RecommendedAuthor[] = [];
    if (user) {
      const { data: myInterests } = await supabase
        .from("profile_interests")
        .select("category_slug")
        .eq("profile_id", user.id);
      const { data: myFollows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const interestSlugs = (myInterests ?? []).map((item) => item.category_slug);
      const followedIds = new Set((myFollows ?? []).map((item) => item.following_id));
      if (interestSlugs.length > 0) {
        const { data: matches } = await supabase
          .from("profile_interests")
          .select("profile_id")
          .in("category_slug", interestSlugs)
          .neq("profile_id", user.id)
          .limit(50);
        const candidateIds = [
          ...new Set((matches ?? []).map((item) => item.profile_id)),
        ].filter((id) => !followedIds.has(id));
        if (candidateIds.length > 0) {
          const { data: candidates } = await supabase
            .from("public_recommended_authors")
            .select("id, username, display_name, creator_headline, follower_count")
            .in("id", candidateIds)
            .limit(6);
          personalAuthors = ((candidates ?? []) as Array<Record<string, unknown>>).map(
            (item) => ({
              id: String(item.id),
              username: String(item.username),
              displayName: String(item.display_name),
              headline: item.creator_headline ? String(item.creator_headline) : null,
              followerCount: Number(item.follower_count),
            }),
          );
        }
      }
    }

    // Wish ids the current user marked with «Хочу также» (for the toggle state).
    const myAlsoWantIds = new Set<string>();
    if (user) {
      const { data: myAlsoWants } = await supabase
        .from("wish_also_wants")
        .select("wish_id")
        .eq("profile_id", user.id)
        .limit(200);
      for (const row of myAlsoWants ?? []) myAlsoWantIds.add(String(row.wish_id));
    }

    const mapWish = (item: Record<string, unknown>): WishPreview | null => {
      const profile = profileById.get(String(item.author_id));
      if (!profile) return null;
      return {
        id: String(item.id),
        title: String(item.title),
        categorySlug: item.category_slug ? String(item.category_slug) : null,
        alsoWantsCount: Number(item.also_wants_count),
        authorName: profile.display_name,
        authorUsername: profile.username,
        userWantsIt: myAlsoWantIds.has(String(item.id)),
      };
    };

    const wishes: WishPreview[] = (
      (rawWishes ?? []) as Array<Record<string, unknown>>
    ).flatMap((item) => {
      const mapped = mapWish(item);
      return mapped ? [mapped] : [];
    });

    const newWishes: WishPreview[] = (
      (rawNewWishes ?? []) as Array<Record<string, unknown>>
    ).flatMap((item) => {
      const mapped = mapWish(item);
      return mapped ? [mapped] : [];
    });

    const growingWishes: WishPreview[] = (
      (rawGrowingWishes ?? []) as Array<Record<string, unknown>>
    ).flatMap((item) => {
      const mapped = mapWish(item);
      return mapped ? [mapped] : [];
    });

    // City feed (scope=city): people nearby, newcomers, local streams,
    // local wishes. Only citizens with show_city and a public profile are
    // exposed; no city selected -> empty, the UI falls back to global.
    let cityName: string | null = null;
    let cityPeople: CityPerson[] = [];
    let cityNewcomers: CityPerson[] = [];
    let cityLiveRooms: LiveRoomPreview[] = [];
    let cityWishes: WishPreview[] = [];
    if (scope === "city" && user) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("city_id, city")
        .eq("id", user.id)
        .maybeSingle();
      if (myProfile?.city_id) {
        const { data: rawCitizens } = await supabase
          .from("public_city_people")
          .select("id, username, display_name, city, is_creator, is_vip")
          .eq("city_id", myProfile.city_id)
          .limit(20);
        const citizens = (rawCitizens ?? []) as Array<{
          id: string;
          username: string;
          display_name: string;
          city: string | null;
          is_creator: boolean;
          is_vip: boolean;
        }>;
        const citizenIds = citizens.map((c) => c.id);
        const { data: follows } = citizenIds.length
          ? await supabase
              .from("user_follows")
              .select("following_id")
              .in("following_id", citizenIds)
          : { data: [] };
        const followerCount = new Map<string, number>();
        for (const follow of follows ?? [])
          followerCount.set(
            follow.following_id,
            (followerCount.get(follow.following_id) ?? 0) + 1,
          );
        const others = citizens.filter((c) => c.id !== user.id);
        const toCityPerson = (c: (typeof others)[number]): CityPerson => ({
          id: c.id,
          username: c.username,
          displayName: c.display_name,
          city: c.city,
          isCreator: c.is_creator,
          followers: followerCount.get(c.id) ?? 0,
          isVip: Boolean(c.is_vip),
        });
        cityPeople = others.slice(0, 4).map(toCityPerson);
        cityNewcomers = others.slice(0, 3).map(toCityPerson);

        const { data: rawCityWishes } = citizenIds.length
          ? await supabase
              .from("wishes")
              .select("id, author_id, title, category_slug, also_wants_count")
              .eq("visibility", "public")
              .eq("is_archived", false)
              .in("author_id", citizenIds)
              .order("also_wants_count", { ascending: false })
              .limit(6)
          : { data: [] };
        cityWishes = ((rawCityWishes ?? []) as Array<Record<string, unknown>>)
          .flatMap((item) => {
            const mapped = mapWish(item);
            return mapped ? [mapped] : [];
          })
          .slice(0, 3);

        const { data: rawCityRooms } = citizenIds.length
          ? await supabase
              .from("live_rooms")
              .select("id, slug, title, host_id")
              .eq("status", "live")
              .eq("visibility", "public")
              .in("host_id", citizenIds)
              .order("started_at", { ascending: false })
              .limit(6)
          : { data: [] };
        cityLiveRooms = (await buildLiveRooms(supabase, rawCityRooms ?? [])).slice(
          0,
          3,
        );

        const { data: cityRow } = await supabase
          .from("cities")
          .select("name")
          .eq("id", myProfile.city_id)
          .maybeSingle();
        cityName = cityRow?.name ?? myProfile.city;
      }
    }

    return {
      authors,
      fundraisers,
      wishes,
      newWishes,
      growingWishes,
      liveRooms,
      popularFundraisers,
      growingFundraisers,
      recommendedAuthors,
      personalAuthors,
      cityName,
      cityPeople,
      cityNewcomers,
      cityLiveRooms,
      cityWishes,
      isDemo: false,
    };
  } catch {
    return {
      authors: [],
      fundraisers: [],
      wishes: [],
      newWishes: [],
      growingWishes: [],
      liveRooms: [],
      popularFundraisers: [],
      growingFundraisers: [],
      recommendedAuthors: [],
      personalAuthors: [],
      cityName: null,
      cityPeople: [],
      cityNewcomers: [],
      cityLiveRooms: [],
      cityWishes: [],
      isDemo: false,
    };
  }
}

const gradients = [
  "from-[#f0448c] via-[#7e42ff] to-[#4bc9ff]",
  "from-[#ff8854] via-[#f0448c] to-[#7e42ff]",
  "from-[#7e42ff] via-[#dc5cff] to-[#ffb75a]",
];

function WishLink({
  wish,
  index,
  href,
}: {
  wish: WishPreview;
  index: number;
  href: Route;
}) {
  const category =
    CATEGORIES.find((item) => item.slug === wish.categorySlug) ?? CATEGORIES.at(-1)!;
  return (
    <div className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#181a24] p-3">
      <Link className="flex min-w-0 grow items-center gap-3" href={href}>
        <Avatar index={index} name={wish.authorName} />
        <div className="min-w-0 grow">
          <p className="truncate text-sm font-bold">{wish.title}</p>
          <p className="truncate text-xs text-[#aaa4b7]">
            {category.emoji} {wish.authorName}
          </p>
        </div>
      </Link>
      <FeedWishToggle
        initialActive={wish.userWantsIt}
        initialCount={wish.alsoWantsCount}
        wishId={wish.id}
      />
    </div>
  );
}

function FundraiserLink({
  fundraiser,
  index,
  href,
}: {
  fundraiser: Fundraiser;
  index: number;
  href: Route;
}) {
  const category =
    CATEGORIES.find((item) => item.slug === fundraiser.categorySlug) ??
    CATEGORIES.at(-1)!;
  return (
    <Link
      className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#181a24] p-3 transition hover:border-[#8f48ff]/60"
      href={href}
    >
      <Avatar index={index} name={fundraiser.authorName} />
      <div className="min-w-0 grow">
        <p className="truncate text-sm font-bold">{fundraiser.authorName}</p>
        <p className="truncate text-xs text-[#aaa4b7]">
          {category.emoji} {fundraiser.title}
        </p>
      </div>
      <span className="rounded-lg bg-gradient-to-r from-[#ff4c87] to-[#7d45ff] px-2.5 py-1.5 text-xs font-semibold">
        {formatRubles(fundraiser.currentAmountMinor)}
      </span>
    </Link>
  );
}

function Avatar({
  name,
  index,
  imageUrl,
}: {
  name: string;
  index: number;
  imageUrl?: string | null;
}) {
  return (
    <span
      className={`grid size-14 place-items-center overflow-hidden rounded-full bg-gradient-to-br p-0.5 ${gradients[index % gradients.length]}`}
    >
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#2b1b30] text-lg font-bold text-white">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL has no stable image host
          <img alt="" className="size-full object-cover" src={imageUrl} />
        ) : (
          name.slice(0, 1).toUpperCase()
        )}
      </span>
    </span>
  );
}

function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] items-center justify-around border-t border-white/10 bg-[#10121b]/95 px-3 py-2 text-[#aaa4b7] backdrop-blur"
      aria-label="Нижняя навигация"
    >
      <Link className="grid place-items-center gap-1 text-xs text-white" href="/feed">
        <Compass className="size-5 fill-current" />
        Главная
      </Link>
      <Link
        className="grid place-items-center gap-1 text-xs hover:text-white"
        href="/places"
      >
        <MapPin className="size-5" />
        Город
      </Link>
      <Link
        className="-mt-6 grid size-14 place-items-center rounded-full bg-gradient-to-br from-[#ff4b8a] to-[#7d45ff] text-white shadow-[0_8px_28px_rgba(173,67,255,0.55)]"
        href="/creator/start"
      >
        <CirclePlus className="size-7" />
      </Link>
      <Link
        className="grid place-items-center gap-1 text-xs hover:text-white"
        href="/notifications"
      >
        <MessageCircle className="size-5" />
        Активность
      </Link>
      <Link
        className="grid place-items-center gap-1 text-xs hover:text-white"
        href="/auth/sign-in"
      >
        <UserRound className="size-5" />
        Профиль
      </Link>
    </nav>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: rawScope = "" } = await searchParams;
  const scope = rawScope === "city" ? "city" : "global";
  const {
    authors,
    fundraisers,
    wishes,
    newWishes,
    growingWishes,
    liveRooms,
    popularFundraisers,
    growingFundraisers,
    recommendedAuthors,
    personalAuthors,
    cityName,
    cityPeople,
    cityNewcomers,
    cityLiveRooms,
    cityWishes,
    isDemo,
  } = await getHomeData(scope);
  const storyAuthors = authors.length > 0 ? authors : demoAuthors;
  const liveRoomsToShow = liveRooms.length > 0 ? liveRooms : demoLiveRooms;
  const popularToShow =
    popularFundraisers.length > 0 ? popularFundraisers : demoFundraisers;
  const growingToShow =
    growingFundraisers.length > 0 ? growingFundraisers : demoFundraisers;
  const authorsToShow =
    recommendedAuthors.length > 0 ? recommendedAuthors : demoRecommendedAuthors;

  const cityMode = scope === "city";
  const cityFallback = cityMode && !cityName;
  const cityEmpty = cityMode && cityName && cityPeople.length === 0;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 pb-24 pt-5 text-white">
      <header className="mb-5 flex items-center justify-between">
        <Link
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
          href="/"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#ff4b8a] to-[#7d45ff] text-sm">
            ♡
          </span>
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#ffd260]">
            <WalletCards className="size-4" /> 2 450
          </span>
          <Link
            className="grid size-8 place-items-center rounded-full border border-white/15 text-[#c5becf]"
            href="/notifications"
          >
            <Bell className="size-4" />
          </Link>
        </div>
      </header>

      <nav
        aria-label="Лента"
        className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#14161f] p-1"
      >
        <Link
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold ${
            cityMode
              ? "bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] text-white"
              : "text-[#aaa4b7]"
          }`}
          href="/feed?scope=city"
        >
          📍 Мой город{cityName ? ` · ${cityName}` : ""}
        </Link>
        <Link
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold ${
            !cityMode
              ? "bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] text-white"
              : "text-[#aaa4b7]"
          }`}
          href="/feed"
        >
          🌎 Вся платформа
        </Link>
      </nav>

      {cityFallback && (
        <section className="mb-5 rounded-2xl border border-[#b550ff]/35 bg-[#1b1528] p-4 text-sm leading-6 text-[#d8d0e0]">
          Укажите город в профиле, чтобы видеть людей рядом и события вашего города.
          Пока показываем ленту всей платформы.
        </section>
      )}
      {cityEmpty && cityName && (
        <section className="mb-5 rounded-2xl border border-[#b550ff]/35 bg-[#1b1528] p-4 text-sm leading-6 text-[#d8d0e0]">
          В {cityName} пока мало людей — пригласите друзей и станьте первыми! А пока
          показываем ленту всей платформы.
        </section>
      )}

      {cityMode && cityName && (
        <Link
          className="mb-5 flex items-center gap-3 rounded-2xl border border-[#7fd8ff]/25 bg-gradient-to-r from-[#14222b] to-[#181a2b] p-4"
          href="/places"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#7fd8ff]/15 text-2xl">
            🏙
          </span>
          <span className="min-w-0 grow">
            <span className="block text-sm font-bold">Цифровой город {cityName}</span>
            <span className="mt-0.5 block text-xs text-[#b8b0c3]">
              Посмотри, кто сейчас здесь — и заходи в место
            </span>
          </span>
          <span className="shrink-0 text-[#7fd8ff]">›</span>
        </Link>
      )}

      {cityMode && cityName && (
        <Link
          className="mb-5 flex items-center gap-3 rounded-2xl border border-[#ffd35e]/30 bg-gradient-to-r from-[#2b193f] to-[#1c1528] p-4"
          href="/cities/battle"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ffd35e]/15 text-2xl">
            🏆
          </span>
          <span className="min-w-0 grow">
            <span className="block text-sm font-bold">Битва городов</span>
            <span className="mt-0.5 block text-xs text-[#b8b0c3]">
              Помоги {cityName} стать первым — приглашай друзей и зарабатывай баллы
            </span>
          </span>
          <span className="shrink-0 text-[#ffd35e]">›</span>
        </Link>
      )}

      {cityMode && cityName && cityPeople.length > 0 && (
        <>
          <section className="mt-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Люди рядом</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/people">
                Смотреть все ›
              </Link>
            </div>
            <div className="space-y-2.5">
              {cityPeople.map((person, index) => (
                <Link
                  className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#181a24] p-3"
                  href={isDemo ? "/auth/sign-in" : (`/u/${person.username}` as Route)}
                  key={person.id}
                >
                  <Avatar index={index} name={person.displayName} />
                  <div className="min-w-0 grow">
                    <p className="truncate text-sm font-bold">
                      {person.displayName}
                      {person.isCreator && (
                        <span className="ml-2 rounded-full bg-gradient-to-r from-[#f94d96] to-[#8953ff] px-1.5 py-0.5 text-[10px] font-semibold">
                          Автор
                        </span>
                      )}
                      {"isVip" in person && person.isVip && (
                        <span className="ml-1 rounded-full border border-[#ffd35e]/50 bg-[#2a2215] px-1.5 py-0.5 text-[10px] font-bold text-[#ffd35e]">
                          👑 VIP
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-[#aaa4b7]">
                      {person.city ?? cityName} · {person.followers} подписчиков
                    </p>
                  </div>
                  <span className="text-[#e3a3d5]">›</span>
                </Link>
              ))}
            </div>
          </section>

          {cityLiveRooms.length > 0 && (
            <section className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold">Сейчас в эфире · город</h2>
                <Link className="text-xs font-medium text-[#b26fff]" href="/feed">
                  Все эфиры ›
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {cityLiveRooms.map((room, index) => (
                  <Link
                    className="w-56 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#181a24]"
                    href={isDemo ? "/auth/sign-in" : (`/live/${room.slug}` as Route)}
                    key={room.id}
                  >
                    <div
                      className={`relative flex h-24 items-center justify-center bg-gradient-to-br ${
                        gradients[index % gradients.length]
                      }/40`}
                    >
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#ff2d55] px-2 py-0.5 text-[10px] font-bold text-white">
                        <span className="size-1.5 animate-pulse rounded-full bg-white" />
                        LIVE
                      </span>
                      <Radio className="size-8 text-[#ffb7dd]" />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-bold">{room.title}</p>
                      <p className="mt-1 flex items-center justify-between gap-2 text-xs text-[#aaa4b7]">
                        <span className="truncate">{room.hostName}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          <UsersRound className="size-3.5" /> {room.viewers}
                        </span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {cityNewcomers.length > 0 && (
            <section className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold">Новые жители</h2>
                <Link className="text-xs font-medium text-[#b26fff]" href="/people">
                  Смотреть все ›
                </Link>
              </div>
              <div className="space-y-2.5">
                {cityNewcomers.map((person, index) => (
                  <Link
                    className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#181a24] p-3"
                    href={isDemo ? "/auth/sign-in" : (`/u/${person.username}` as Route)}
                    key={person.id}
                  >
                    <Avatar index={index} name={person.displayName} />
                    <div className="min-w-0 grow">
                      <p className="truncate text-sm font-bold">{person.displayName}</p>
                      <p className="truncate text-xs text-[#aaa4b7]">
                        {person.city ?? cityName} · {person.followers} подписчиков
                      </p>
                    </div>
                    <span className="text-[#e3a3d5]">›</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {cityWishes.length > 0 && (
            <section className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold">Желания города</h2>
                <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
                  Смотреть все ›
                </Link>
              </div>
              <div className="space-y-2.5">
                {cityWishes.map((wish, index) => (
                  <WishLink
                    href={isDemo ? "/auth/sign-in" : (`/wishes/${wish.id}` as Route)}
                    index={index}
                    key={wish.id}
                    wish={wish}
                  />
                ))}
              </div>
            </section>
          )}

          <Link
            className="mt-7 flex items-center gap-3 rounded-2xl border border-[#7fd8ff]/25 bg-gradient-to-r from-[#14222b] to-[#181a2b] p-4"
            href="/events"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#7fd8ff]/15 text-2xl">
              📅
            </span>
            <span className="min-w-0 grow">
              <span className="block text-sm font-bold">События города</span>
              <span className="mt-0.5 block text-xs text-[#b8b0c3]">
                Встречи, прогулки и турниры — создайте или присоединяйтесь
              </span>
            </span>
            <span className="shrink-0 text-[#7fd8ff]">›</span>
          </Link>
        </>
      )}

      {!cityMode || cityFallback || cityEmpty ? (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-base font-bold">Новые stories</h1>
              <span className="text-xs font-medium text-[#b26fff]">Смотреть все ›</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {storyAuthors.map((author, index) => {
                const href = author.storyId
                  ? (`/stories/${author.storyId}` as Route)
                  : "/creator/start";
                return (
                  <Link
                    className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                    href={href}
                    key={author.id}
                  >
                    <Avatar imageUrl={null} index={index} name={author.displayName} />
                    <span className="w-16 truncate text-center text-xs text-[#e7e1ee]">
                      {author.displayName}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Сейчас в эфире</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/live/new">
                Создать эфир ›
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {liveRoomsToShow.map((room, index) => {
                const href = isDemo ? "/auth/sign-in" : (`/live/${room.slug}` as Route);
                return (
                  <Link
                    className="w-56 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#181a24]"
                    href={href}
                    key={room.id}
                  >
                    <div
                      className={`relative flex h-24 items-center justify-center bg-gradient-to-br ${
                        gradients[index % gradients.length]
                      }/40`}
                    >
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#ff2d55] px-2 py-0.5 text-[10px] font-bold text-white">
                        <span className="size-1.5 animate-pulse rounded-full bg-white" />
                        LIVE
                      </span>
                      <Radio className="size-8 text-[#ffb7dd]" />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-bold">{room.title}</p>
                      <p className="mt-1 flex items-center justify-between gap-2 text-xs text-[#aaa4b7]">
                        <span className="truncate">{room.hostName}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          <UsersRound className="size-3.5" /> {room.viewers}
                        </span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">✨ Популярные желания</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
                Смотреть все ›
              </Link>
            </div>
            <div className="space-y-2.5">
              {(wishes.length ? wishes : demoWishes).slice(0, 3).map((wish, index) => (
                <WishLink
                  href={isDemo ? "/auth/sign-in" : (`/wishes/${wish.id}` as Route)}
                  index={index}
                  key={wish.id}
                  wish={wish}
                />
              ))}
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">🆕 Новые желания</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
                Смотреть все ›
              </Link>
            </div>
            <div className="space-y-2.5">
              {(newWishes.length ? newWishes : demoWishes)
                .slice(0, 3)
                .map((wish, index) => (
                  <WishLink
                    href={isDemo ? "/auth/sign-in" : (`/wishes/${wish.id}` as Route)}
                    index={index}
                    key={wish.id}
                    wish={wish}
                  />
                ))}
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">🚀 Желания растут</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
                Смотреть все ›
              </Link>
            </div>
            <div className="space-y-2.5">
              {(growingWishes.length ? growingWishes : demoWishes)
                .slice(0, 3)
                .map((wish, index) => (
                  <WishLink
                    href={isDemo ? "/auth/sign-in" : (`/wishes/${wish.id}` as Route)}
                    index={index}
                    key={wish.id}
                    wish={wish}
                  />
                ))}
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Можно поддержать</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
                Смотреть все ›
              </Link>
            </div>
            <div className="space-y-2.5">
              {fundraisers.slice(0, 3).map((fundraiser, index) => (
                <FundraiserLink
                  fundraiser={fundraiser}
                  href={
                    isDemo
                      ? "/auth/sign-in"
                      : (`/fundraisers/${fundraiser.slug}` as Route)
                  }
                  index={index}
                  key={fundraiser.id}
                />
              ))}
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">🔥 Популярные сборы</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
                Смотреть все ›
              </Link>
            </div>
            <div className="space-y-2.5">
              {popularToShow.slice(0, 3).map((fundraiser, index) => (
                <FundraiserLink
                  fundraiser={fundraiser}
                  href={
                    isDemo
                      ? "/auth/sign-in"
                      : (`/fundraisers/${fundraiser.slug}` as Route)
                  }
                  index={index}
                  key={fundraiser.id}
                />
              ))}
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">🚀 Быстро растут</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
                Смотреть все ›
              </Link>
            </div>
            <div className="space-y-2.5">
              {growingToShow.slice(0, 3).map((fundraiser, index) => (
                <FundraiserLink
                  fundraiser={fundraiser}
                  href={
                    isDemo
                      ? "/auth/sign-in"
                      : (`/fundraisers/${fundraiser.slug}` as Route)
                  }
                  index={index}
                  key={fundraiser.id}
                />
              ))}
            </div>
          </section>

          {personalAuthors.length > 0 && (
            <section className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold">💜 Для вас</h2>
                <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
                  Смотреть все ›
                </Link>
              </div>
              <div className="space-y-2.5">
                {personalAuthors.slice(0, 3).map((author) => (
                  <Link
                    className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#181a24] p-3 transition hover:border-[#8f48ff]/60"
                    href={isDemo ? "/auth/sign-in" : (`/u/${author.username}` as Route)}
                    key={author.id}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ff4b8a] to-[#7d45ff] text-sm font-bold text-white">
                      {author.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 grow">
                      <p className="truncate text-sm font-bold">{author.displayName}</p>
                      <p className="truncate text-xs text-[#aaa4b7]">
                        {author.headline ?? "Автор в «Хочу также»"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[#aaa4b7]">
                      {author.followerCount} подписчиков
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Рекомендуем авторов</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
                Смотреть все ›
              </Link>
            </div>
            <div className="space-y-2.5">
              {authorsToShow.slice(0, 3).map((author) => (
                <Link
                  className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#181a24] p-3 transition hover:border-[#8f48ff]/60"
                  href={isDemo ? "/auth/sign-in" : (`/u/${author.username}` as Route)}
                  key={author.id}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ff4b8a] to-[#7d45ff] text-sm font-bold text-white">
                    {author.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 grow">
                    <p className="truncate text-sm font-bold">{author.displayName}</p>
                    <p className="truncate text-xs text-[#aaa4b7]">
                      {author.headline ?? "Автор в «Хочу также»"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[#aaa4b7]">
                    {author.followerCount} подписчиков
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="border-white/8 mt-7 rounded-2xl border bg-gradient-to-br from-[#1f1631] to-[#171824] p-4">
            <p className="text-sm font-bold">Хочешь тоже зарабатывать?</p>
            <p className="mt-1 text-xs leading-5 text-[#b9b1c5]">
              Создай страницу автора, публикуй stories и собери свою аудиторию.
            </p>
            <Link
              className="mt-3 inline-flex h-9 items-center rounded-xl bg-white px-3.5 text-xs font-bold text-[#3a1a49]"
              href="/creator/start"
            >
              ✨ Хочу также
            </Link>
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Популярные интересы</h2>
              <Link className="text-xs font-medium text-[#b26fff]" href="/search">
                Смотреть все ›
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Gamepad2, label: "Игры", color: "text-[#ad79ff]" },
                { icon: Music2, label: "Музыка", color: "text-[#fd65b6]" },
                { icon: MessageCircle, label: "Общение", color: "text-[#ffbd65]" },
                { icon: Plane, label: "Путешествия", color: "text-[#7aa9ff]" },
              ].map(({ icon: Icon, label, color }) => (
                <Link
                  className="border-white/8 rounded-2xl border bg-[#181a24] p-3 text-center"
                  href={`/search?q=${encodeURIComponent(label)}` as Route}
                  key={label}
                >
                  <Icon className={`mx-auto size-6 ${color}`} />
                  <span className="mt-2 block text-xs font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
      <BottomNav />
    </main>
  );
}
