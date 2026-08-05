import Link from "next/link";
import type { Route } from "next";
import {
  Bell,
  CirclePlus,
  Compass,
  Gamepad2,
  MessageCircle,
  Music2,
  Plane,
  Radio,
  Search,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

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
};

type LiveRoomPreview = {
  id: string;
  slug: string;
  title: string;
  hostName: string;
  hostUsername: string;
  viewers: number;
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

const demoWishes: WishPreview[] = [
  {
    id: "wish-1",
    title: "Новый MacBook для видео",
    categorySlug: "electronics",
    alsoWantsCount: 1284,
    authorName: "Настя",
    authorUsername: "nastya",
  },
  {
    id: "wish-2",
    title: "Увидеть Японию весной",
    categorySlug: "travel",
    alsoWantsCount: 864,
    authorName: "Лиза",
    authorUsername: "liza",
  },
  {
    id: "wish-3",
    title: "Собрать домашнюю студию",
    categorySlug: "music",
    alsoWantsCount: 521,
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

async function getHomeData() {
  if (!hasSupabaseEnvironment()) {
    return {
      authors: demoAuthors,
      fundraisers: demoFundraisers,
      wishes: demoWishes,
      liveRooms: demoLiveRooms,
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();
    const [
      { data: rawStories },
      { data: rawFundraisers },
      { data: rawWishes },
      { data: rawLiveRooms },
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
        .from("live_rooms")
        .select("id, slug, title, host_id")
        .eq("status", "live")
        .eq("visibility", "public")
        .order("started_at", { ascending: false })
        .limit(10),
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

    const fundraisers: Fundraiser[] = (
      (rawFundraisers ?? []) as Array<Record<string, unknown>>
    ).map((item) => ({
      id: String(item.id),
      slug: String(item.slug),
      title: String(item.title),
      categorySlug: item.category_slug ? String(item.category_slug) : null,
      currentAmountMinor: Number(item.current_amount_minor),
      targetAmountMinor: Number(item.target_amount_minor),
      authorName: String(item.author_display_name),
      authorUsername: String(item.author_username),
    }));

    const wishes: WishPreview[] = (
      (rawWishes ?? []) as Array<Record<string, unknown>>
    ).flatMap((item) => {
      const profile = profileById.get(String(item.author_id));
      return profile
        ? [
            {
              id: String(item.id),
              title: String(item.title),
              categorySlug: item.category_slug ? String(item.category_slug) : null,
              alsoWantsCount: Number(item.also_wants_count),
              authorName: profile.display_name,
              authorUsername: profile.username,
            },
          ]
        : [];
    });

    return { authors, fundraisers, wishes, liveRooms, isDemo: false };
  } catch {
    return {
      authors: [],
      fundraisers: [],
      wishes: [],
      liveRooms: [],
      isDemo: false,
    };
  }
}

const gradients = [
  "from-[#f0448c] via-[#7e42ff] to-[#4bc9ff]",
  "from-[#ff8854] via-[#f0448c] to-[#7e42ff]",
  "from-[#7e42ff] via-[#dc5cff] to-[#ffb75a]",
];

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
        href="/search"
      >
        <Search className="size-5" />
        Поиск
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

export default async function HomePage() {
  const { authors, fundraisers, wishes, liveRooms, isDemo } = await getHomeData();
  const storyAuthors = authors.length > 0 ? authors : demoAuthors;
  const liveRoomsToShow = liveRooms.length > 0 ? liveRooms : demoLiveRooms;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 pb-24 pt-5 text-white">
      <header className="mb-7 flex items-center justify-between">
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
          <h2 className="text-base font-bold">Популярные желания</h2>
          <Link className="text-xs font-medium text-[#b26fff]" href="/discover">
            Смотреть все ›
          </Link>
        </div>
        <div className="space-y-2.5">
          {(wishes.length ? wishes : demoWishes).slice(0, 3).map((wish, index) => {
            const category =
              CATEGORIES.find((item) => item.slug === wish.categorySlug) ??
              CATEGORIES.at(-1)!;
            const href = isDemo ? "/auth/sign-in" : (`/wishes/${wish.id}` as Route);
            return (
              <Link
                className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#181a24] p-3"
                href={href}
                key={wish.id}
              >
                <Avatar index={index} name={wish.authorName} />
                <div className="min-w-0 grow">
                  <p className="truncate text-sm font-bold">{wish.title}</p>
                  <p className="truncate text-xs text-[#aaa4b7]">
                    {category.emoji} {wish.authorName} · {wish.alsoWantsCount} хотят
                    также
                  </p>
                </div>
                <span className="text-xl">✨</span>
              </Link>
            );
          })}
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
          {fundraisers.slice(0, 3).map((fundraiser, index) => {
            const category =
              CATEGORIES.find((item) => item.slug === fundraiser.categorySlug) ??
              CATEGORIES.at(-1)!;
            const href = isDemo
              ? "/auth/sign-in"
              : (`/fundraisers/${fundraiser.slug}` as Route);
            return (
              <Link
                className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#181a24] p-3 transition hover:border-[#8f48ff]/60"
                href={href}
                key={fundraiser.id}
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
          })}
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
      <BottomNav />
    </main>
  );
}
