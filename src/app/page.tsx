import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  ChevronRight,
  CircleUserRound,
  Heart,
  MessageCircle,
  Plus,
  UsersRound,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES } from "@/lib/constants";
import { getSignedImageUrl } from "@/lib/media";
import { formatRubles } from "@/lib/money";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type FeedItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  categorySlug: string | null;
  targetAmountMinor: number;
  currentAmountMinor: number;
  participantsCount: number;
  authorName: string;
  authorUsername: string;
  city: string | null;
  avatarUrl: string | null;
};

type PersonItem = {
  id: string;
  username: string;
  displayName: string;
  city: string | null;
};

const demoFundraisers: FeedItem[] = [
  {
    id: "demo-1",
    slug: "demo-1",
    title: "Камера для первых съёмок",
    description: "Хочу начать снимать людей и рассказывать их истории.",
    categorySlug: "hobbies",
    targetAmountMinor: 15000000,
    currentAmountMinor: 8750000,
    participantsCount: 43,
    authorName: "Настя Орлова",
    authorUsername: "nastya",
    city: "Казань",
    avatarUrl: null,
  },
  {
    id: "demo-2",
    slug: "demo-2",
    title: "Моя первая электрогитара",
    description: "Собираю на инструмент, чтобы наконец начать играть в группе.",
    categorySlug: "music",
    targetAmountMinor: 6500000,
    currentAmountMinor: 2840000,
    participantsCount: 19,
    authorName: "Максим Белов",
    authorUsername: "max",
    city: "Москва",
    avatarUrl: null,
  },
  {
    id: "demo-3",
    slug: "demo-3",
    title: "Увидеть цветение сакуры",
    description: "Мечтаю впервые попасть в Японию весной.",
    categorySlug: "travel",
    targetAmountMinor: 18000000,
    currentAmountMinor: 6320000,
    participantsCount: 31,
    authorName: "Лиза Соколова",
    authorUsername: "liza",
    city: "Санкт-Петербург",
    avatarUrl: null,
  },
];

const demoPeople: PersonItem[] = [
  { id: "person-1", username: "nastya", displayName: "Настя Орлова", city: "Казань" },
  { id: "person-2", username: "max", displayName: "Максим Белов", city: "Москва" },
  {
    id: "person-3",
    username: "liza",
    displayName: "Лиза Соколова",
    city: "Санкт-Петербург",
  },
];

async function getHomeData() {
  if (!hasSupabaseEnvironment()) {
    return { fundraisers: demoFundraisers, people: demoPeople, isDemo: true };
  }

  try {
    const supabase = await createClient();
    const [{ data: rawFundraisers }, { data: rawPeople }] = await Promise.all([
      supabase
        .from("public_fundraiser_feed")
        .select(
          "id, slug, title, description, category_slug, target_amount_minor, current_amount_minor, participant_count, author_display_name, author_username, author_city, author_avatar_path",
        )
        .order("published_at", { ascending: false })
        .limit(12),
      supabase
        .from("profiles")
        .select("id, username, display_name, city, show_city")
        .eq("profile_visibility", "public")
        .eq("is_suspended", false)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const parsedFundraisers = (
      (rawFundraisers ?? []) as Array<Record<string, unknown>>
    ).map((item) => ({
      id: String(item.id),
      slug: String(item.slug),
      title: String(item.title),
      description: item.description ? String(item.description) : null,
      categorySlug: item.category_slug ? String(item.category_slug) : null,
      targetAmountMinor: Number(item.target_amount_minor),
      currentAmountMinor: Number(item.current_amount_minor),
      participantsCount: Number(item.participant_count),
      authorName: String(item.author_display_name),
      authorUsername: String(item.author_username),
      city: item.author_city ? String(item.author_city) : null,
      avatarPath: item.author_avatar_path ? String(item.author_avatar_path) : null,
    }));
    const fundraisers: FeedItem[] = await Promise.all(
      parsedFundraisers.map(async ({ avatarPath, ...item }) => ({
        ...item,
        avatarUrl: await getSignedImageUrl({ bucket: "avatars", path: avatarPath }),
      })),
    );
    const people: PersonItem[] = (
      (rawPeople ?? []) as Array<Record<string, unknown>>
    ).map((item) => ({
      id: String(item.id),
      username: String(item.username),
      displayName: String(item.display_name),
      city: item.show_city && item.city ? String(item.city) : null,
    }));

    return { fundraisers, people, isDemo: false };
  } catch {
    return { fundraisers: [], people: [], isDemo: false };
  }
}

function Avatar({
  name,
  imageUrl,
  index = 0,
  size = "normal",
}: {
  name: string;
  imageUrl?: string | null;
  index?: number;
  size?: "small" | "normal";
}) {
  const colors = ["bg-[#f0b5a7]", "bg-[#b9d6ca]", "bg-[#c7b3db]", "bg-[#f0cb81]"];
  const dimensions = size === "small" ? "size-9 text-xs" : "size-12 text-base";

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white font-bold text-[#563941] shadow-sm ${dimensions} ${colors[index % colors.length]}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a signed Storage URL has no stable image host
        <img alt={`Аватар ${name}`} className="size-full object-cover" src={imageUrl} />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function ProfileFundraiserCard({
  item,
  index,
  isDemo,
}: {
  item: FeedItem;
  index: number;
  isDemo: boolean;
}) {
  const category =
    CATEGORIES.find((categoryItem) => categoryItem.slug === item.categorySlug) ??
    CATEGORIES.at(-1)!;
  const progress = Math.min(
    100,
    Math.round((item.currentAmountMinor / item.targetAmountMinor) * 100),
  );
  const profileHref = isDemo ? "/auth/sign-in" : (`/u/${item.authorUsername}` as Route);
  const fundraiserHref = isDemo
    ? "/auth/sign-in"
    : (`/fundraisers/${item.slug}` as Route);

  return (
    <article className="surface rounded-2xl p-4 transition hover:shadow-glow sm:p-5">
      <div className="flex items-start gap-3">
        <Link href={profileHref}>
          <Avatar imageUrl={item.avatarUrl} index={index} name={item.authorName} />
        </Link>
        <div className="min-w-0 grow">
          <Link className="block" href={profileHref}>
            <p className="truncate font-bold transition hover:text-[#bd3e66]">
              {item.authorName}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#8e747c]">
              @{item.authorUsername}
              {item.city ? ` · ${item.city}` : ""}
            </p>
          </Link>
          <span className="mt-2 inline-flex rounded-full bg-[#fff1f4] px-2.5 py-1 text-xs font-semibold text-[#a34c67]">
            {category.emoji} {category.label}
          </span>
        </div>
      </div>

      <Link className="mt-4 block" href={fundraiserHref}>
        <p className="text-sm text-[#856e75]">Главное желание</p>
        <h2 className="mt-1 text-lg font-bold leading-6">{item.title}</h2>
        {item.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#725c63]">
            {item.description}
          </p>
        )}
      </Link>

      <div className="mt-4 rounded-xl bg-[#fff8f9] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#c53d68]">
            {formatRubles(item.currentAmountMinor)}
          </span>
          <span className="text-xs text-[#8e747c]">
            из {formatRubles(item.targetAmountMinor)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f6e8ec]">
          <div
            className="h-full rounded-full bg-[#df4f7d]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center gap-4 text-xs text-[#8e747c]">
          <span className="inline-flex items-center gap-1">
            <UsersRound className="size-3.5" /> {item.participantsCount} участников
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" /> Обсуждение
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[#df4f7d] px-3 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
          href={fundraiserHref}
        >
          <Heart className="mr-1.5 size-4" /> Поддержать
        </Link>
        <Link
          aria-label={`Открыть профиль ${item.authorName}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[#ead9df] bg-white px-3 text-sm font-semibold text-[#765f66] transition hover:border-[#df4f7d]"
          href={profileHref}
        >
          Профиль
        </Link>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const { fundraisers, people, isDemo } = await getHomeData();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <section className="surface flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#bd3e66]">Желания людей</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Посмотрите, что сейчас важно другим
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#826c73]">
              Создайте желание, поделитесь им — и позвольте людям поддержать вашу
              историю.
            </p>
          </div>
          <Link
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
            href="/wishes/new"
          >
            <Plus className="size-4" /> Создать желание
          </Link>
        </section>

        <section className="mt-8" id="feed">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#bd3e66]">Лента анкет</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Люди и их сборы
              </h2>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="rounded-lg bg-[#fff0f4] px-3 py-1.5 font-semibold text-[#bd3e66]">
                Новые
              </span>
              <Link
                className="rounded-lg px-3 py-1.5 font-semibold text-[#765f66] transition hover:bg-white"
                href="/discover"
              >
                Все желания
              </Link>
            </div>
          </div>
          {isDemo && (
            <p className="mb-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-800">
              Пока это демонстрационные анкеты. После подключения Supabase здесь
              появятся реальные публичные профили с актуальными сборами.
            </p>
          )}
          {fundraisers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {fundraisers.map((item, index) => (
                <ProfileFundraiserCard
                  index={index}
                  isDemo={isDemo}
                  item={item}
                  key={item.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              actionHref="/fundraisers/new"
              actionLabel="Создать первый сбор"
              description="Здесь появятся анкеты людей с их активными целями. Начните со своей истории."
              title="Лента ждёт первую анкету"
            />
          )}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="surface rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#bd3e66]">Интересы</p>
                <h2 className="mt-1 text-xl font-bold">Найдите близкое по духу</h2>
              </div>
              <Link className="text-sm font-semibold text-[#a13d5e]" href="/discover">
                Смотреть всё <ChevronRight className="inline size-4" />
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 8).map((category) => (
                <Link
                  className="rounded-xl border border-[#f0e2e6] bg-[#fffafb] px-3 py-2 text-sm font-medium text-[#674f57] transition hover:border-[#efafc2] hover:bg-rose-50"
                  href={`/search?q=${encodeURIComponent(category.label)}` as Route}
                  key={category.slug}
                >
                  {category.emoji} {category.label}
                </Link>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl bg-[#fff0cf] p-5">
            <Heart className="size-5 fill-[#df4f7d] text-[#df4f7d]" />
            <h2 className="mt-3 text-xl font-bold text-[#5f3d2e]">
              Одна мечта — уже начало
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#79584b]">
              Необязательно сразу создавать сбор. Начните с желания, а решение о
              поддержке придёт потом.
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#9c4a35]"
              href="/wishes/new"
            >
              Добавить желание <ArrowRight className="size-4" />
            </Link>
          </aside>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-[#bd3e66]">Новые в сообществе</p>
              <h2 className="mt-1 text-xl font-bold">Ещё люди</h2>
            </div>
            <Link className="text-sm font-semibold text-[#a13d5e]" href="/people">
              Все люди →
            </Link>
          </div>
          {people.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person, index) => (
                <Link
                  className="surface flex items-center gap-3 rounded-2xl p-3.5 transition hover:shadow-glow"
                  href={isDemo ? "/auth/sign-in" : (`/u/${person.username}` as Route)}
                  key={person.id}
                >
                  <Avatar index={index} name={person.displayName} size="small" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{person.displayName}</p>
                    <p className="truncate text-xs text-[#8e747c]">
                      @{person.username}
                      {person.city ? ` · ${person.city}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              actionHref="/onboarding"
              actionLabel="Создать профиль"
              description="Публичные профили появятся здесь после регистрации первых участников."
              title="Здесь будут новые люди"
            />
          )}
        </section>
      </main>
      <footer className="border-t border-[#eee1e4] py-7 text-center text-sm text-[#8e747c]">
        <CircleUserRound className="mr-1.5 inline size-4 align-text-bottom" /> GiftOS ·
        Платформа желаний, поддержки и общения
      </footer>
    </>
  );
}
