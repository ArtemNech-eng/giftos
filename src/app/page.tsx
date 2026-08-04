import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  ChevronRight,
  CircleUserRound,
  Heart,
  MessageCircle,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES } from "@/lib/constants";
import { formatRubles } from "@/lib/money";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type FeedItem = {
  id: string;
  slug: string;
  title: string;
  categorySlug: string | null;
  targetAmountMinor: number;
  currentAmountMinor: number;
  participantsCount: number;
  authorName: string;
  authorUsername: string;
  city: string | null;
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
    categorySlug: "hobbies",
    targetAmountMinor: 15000000,
    currentAmountMinor: 8750000,
    participantsCount: 43,
    authorName: "Настя Орлова",
    authorUsername: "nastya",
    city: "Казань",
  },
  {
    id: "demo-2",
    slug: "demo-2",
    title: "Моя первая электрогитара",
    categorySlug: "music",
    targetAmountMinor: 6500000,
    currentAmountMinor: 2840000,
    participantsCount: 19,
    authorName: "Максим Белов",
    authorUsername: "max",
    city: "Москва",
  },
  {
    id: "demo-3",
    slug: "demo-3",
    title: "Увидеть цветение сакуры",
    categorySlug: "travel",
    targetAmountMinor: 18000000,
    currentAmountMinor: 6320000,
    participantsCount: 31,
    authorName: "Лиза Соколова",
    authorUsername: "liza",
    city: "Санкт-Петербург",
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
          "id, slug, title, category_slug, target_amount_minor, current_amount_minor, participant_count, author_display_name, author_username, author_city",
        )
        .order("published_at", { ascending: false })
        .limit(6),
      supabase
        .from("profiles")
        .select("id, username, display_name, city, show_city")
        .eq("profile_visibility", "public")
        .eq("is_suspended", false)
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

    const fundraisers: FeedItem[] = (
      (rawFundraisers ?? []) as Array<Record<string, unknown>>
    ).map((item) => ({
      id: String(item.id),
      slug: String(item.slug),
      title: String(item.title),
      categorySlug: item.category_slug ? String(item.category_slug) : null,
      targetAmountMinor: Number(item.target_amount_minor),
      currentAmountMinor: Number(item.current_amount_minor),
      participantsCount: Number(item.participant_count),
      authorName: String(item.author_display_name),
      authorUsername: String(item.author_username),
      city: item.author_city ? String(item.author_city) : null,
    }));
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

function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  const colors = ["bg-[#f0b5a7]", "bg-[#b9d6ca]", "bg-[#c7b3db]", "bg-[#f0cb81]"];
  return (
    <span
      className={`grid size-10 place-items-center rounded-full border-2 border-white text-sm font-bold text-[#563941] ${colors[index % colors.length]}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default async function HomePage() {
  const { fundraisers, people, isDemo } = await getHomeData();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-7 sm:px-6 lg:pt-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[#42262f] px-6 py-10 text-white shadow-[0_24px_60px_rgba(83,37,52,0.18)] sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute -right-8 -top-10 size-48 rounded-full bg-[#df4f7d]/70 blur-3xl" />
          <div className="absolute bottom-0 left-[42%] size-36 rounded-full bg-[#ffc86b]/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-rose-100">
              <Sparkles className="size-4 text-[#ffd179]" /> Желания становятся ближе
              вместе
            </p>
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Не просто собирайте. Делитесь мечтой.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-rose-100/85 sm:text-lg">
              GiftOS — место, где желания становятся поводом поддержать, познакомиться и
              сделать чей-то день особенным.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#9e3457] transition hover:bg-rose-50"
                href="/wishes/new"
              >
                Создать желание <ArrowRight className="size-4" />
              </Link>
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
                href="/fundraisers/new"
              >
                Создать сбор <Target className="size-4" />
              </Link>
            </div>
          </div>
          <div className="relative mt-10 flex flex-wrap gap-x-9 gap-y-4 border-t border-white/15 pt-6 sm:mt-12">
            <div>
              <b className="text-xl">1 идея</b>
              <span className="ml-2 text-sm text-rose-100/75">
                может вдохновить многих
              </span>
            </div>
            <div>
              <b className="text-xl">∞ поводов</b>
              <span className="ml-2 text-sm text-rose-100/75">сделать добро</span>
            </div>
          </div>
        </section>

        <section className="mt-10" id="feed">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#bd3e66]">Сейчас происходит</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Новые сборы</h2>
            </div>
            <Link
              className="group hidden items-center gap-1 text-sm font-semibold text-[#a13d5e] sm:inline-flex"
              href="/discover"
            >
              Вся лента{" "}
              <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
          {isDemo && (
            <p className="mb-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-800">
              Это демонстрационные карточки. Подключите Supabase — здесь автоматически
              появятся реальные публичные сборы.
            </p>
          )}
          {fundraisers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {fundraisers.map((item, index) => {
                const category =
                  CATEGORIES.find((category) => category.slug === item.categorySlug) ??
                  CATEGORIES.at(-1)!;
                const progress = Math.min(
                  100,
                  Math.round((item.currentAmountMinor / item.targetAmountMinor) * 100),
                );
                const href = isDemo
                  ? "/auth/sign-in"
                  : (`/fundraisers/${item.slug}` as Route);
                return (
                  <article
                    className="surface group overflow-hidden rounded-2xl"
                    key={item.id}
                  >
                    <Link href={href}>
                      <div className="relative grid h-36 place-items-center bg-gradient-to-br from-[#fde3bc] to-[#f6b9aa]">
                        <span
                          className="drop-shadow-sm transition duration-300 group-hover:scale-110"
                          style={{ fontSize: "4.25rem" }}
                        >
                          {category.emoji}
                        </span>
                        <span className="absolute right-3 top-3 rounded-full bg-white/75 px-2.5 py-1 text-xs font-semibold text-[#71545c] backdrop-blur">
                          Новый сбор
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar index={index} name={item.authorName} />
                          <p className="truncate text-sm font-semibold">
                            {item.authorName}
                            <span className="font-normal text-[#8e747c]">
                              {item.city ? ` · ${item.city}` : ""}
                            </span>
                          </p>
                        </div>
                        <h3 className="mt-3 min-h-12 text-base font-bold leading-6">
                          {item.title}
                        </h3>
                        <div className="mt-3 flex items-baseline justify-between text-sm">
                          <span className="font-bold text-[#c53d68]">
                            {formatRubles(item.currentAmountMinor)}
                          </span>
                          <span className="text-[#8e747c]">
                            из {formatRubles(item.targetAmountMinor)}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f6e8ec]">
                          <div
                            className="h-full rounded-full bg-[#df4f7d]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-[#8e747c]">
                          <span className="inline-flex items-center gap-1">
                            <UsersRound className="size-3.5" /> {item.participantsCount}{" "}
                            участников
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="size-3.5" /> Скоро чат
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              actionHref="/fundraisers/new"
              actionLabel="Создать первый сбор"
              description="Здесь появятся публичные сборы сообщества. Начните с собственной цели — она станет первой активностью в ленте."
              title="Лента ждёт первую историю"
            />
          )}
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="surface rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#bd3e66]">Найдите своё</p>
                <h2 className="mt-1 text-xl font-bold">Исследуйте по интересам</h2>
              </div>
              <Sparkles className="size-5 text-[#e3a348]" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 8).map((category) => (
                <Link
                  className="rounded-xl border border-[#f0e2e6] bg-[#fffafb] px-3 py-2 text-sm font-medium text-[#674f57] transition hover:border-[#efafc2] hover:bg-rose-50"
                  href="/discover"
                  key={category.slug}
                >
                  <span className="mr-1.5">{category.emoji}</span>
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl bg-[#ffeabf] p-5 sm:p-6">
            <Heart className="size-5 fill-[#df4f7d] text-[#df4f7d]" />
            <h2 className="mt-3 text-xl font-bold text-[#5f3d2e]">Есть мечта?</h2>
            <p className="mt-2 text-sm leading-6 text-[#79584b]">
              Расскажите о ней. Близкие смогут поддержать, а новые люди — разделить ваш
              интерес.
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#9c4a35]"
              href="/wishes/new"
            >
              Начать с желания <ArrowRight className="size-4" />
            </Link>
          </aside>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-[#bd3e66]">Новое в сообществе</p>
              <h2 className="mt-1 text-2xl font-bold">Люди и их желания</h2>
            </div>
            <Link
              className="hidden text-sm font-semibold text-[#a13d5e] sm:inline"
              href="/people"
            >
              Все люди →
            </Link>
          </div>
          {people.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {people.map((person, index) => (
                <Link
                  className="surface flex items-center gap-3 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
                  href={isDemo ? "/auth/sign-in" : (`/u/${person.username}` as Route)}
                  key={person.id}
                >
                  <Avatar index={index} name={person.displayName} />
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
              description="Публичные профили с желаниями появятся здесь после регистрации первых участников."
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
