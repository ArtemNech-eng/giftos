import Link from "next/link";
import type { Route } from "next";
/* eslint-disable @next/next/no-img-element -- wish images and avatars use short-lived signed Storage URLs */
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Heart,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";

import { FeedWishToggle } from "@/components/feed-wish-toggle";
import { WishCategoryIcon } from "@/components/wish-category-icon";
import { requireUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Желания",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type WishRow = {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  image_path: string | null;
  estimated_cost_minor: number | null;
  category_slug: string | null;
  visibility: "public" | "private";
  also_wants_count: number;
  created_at: string;
};
type AuthorRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
};
type WishCard = WishRow & {
  imageUrl: string | null;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  userWantsIt: boolean;
  isOwn: boolean;
};

const SCOPES = [
  { key: "mine", label: "Мои" },
  { key: "city", label: "Город" },
  { key: "platform", label: "Платформа" },
] as const;

type WishScope = (typeof SCOPES)[number]["key"];

function WishVisual({ wish }: { wish: WishCard }) {
  return (
    <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#f3e8ff] to-[#fff0f6] text-[#8753e6]">
      {wish.imageUrl ? (
        <img
          loading="lazy"
          decoding="async"
          alt=""
          className="size-full object-cover"
          src={wish.imageUrl}
        />
      ) : (
        <WishCategoryIcon category={wish.category_slug} className="size-6" />
      )}
    </span>
  );
}

function AuthorAvatar({ author }: { author: NonNullable<WishCard["author"]> }) {
  return (
    <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff83b0] to-[#815be8] p-px">
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f8f4fc] text-[7px] font-black text-[#372c41]">
        {author.avatarUrl ? (
          <img
            loading="lazy"
            decoding="async"
            alt=""
            className="size-full object-cover"
            src={author.avatarUrl}
          />
        ) : (
          author.displayName.slice(0, 1).toUpperCase()
        )}
      </span>
    </span>
  );
}

function WishListCard({ wish, ownList }: { wish: WishCard; ownList: boolean }) {
  const editable = ownList || wish.isOwn;
  return (
    <article className="border-[#2c2036]/9 rounded-[1.45rem] border bg-white p-3.5 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
      <Link className="flex items-center gap-3" href={`/wishes/${wish.id}` as Route}>
        <WishVisual wish={wish} />
        <span className="min-w-0 grow">
          <span className="flex items-center gap-2">
            <b className="truncate text-sm">{wish.title}</b>
            {wish.visibility === "private" && (
              <span className="shrink-0 rounded-full bg-[#f3eef7] px-1.5 py-0.5 text-[8px] font-black text-[#756a7d]">
                Только ты
              </span>
            )}
          </span>
          {wish.author && !editable ? (
            <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-[#796d80]">
              <AuthorAvatar author={wish.author} />
              <span className="truncate">{wish.author.displayName}</span>
            </span>
          ) : (
            <span className="mt-1 flex items-center gap-1.5 text-[10px] text-[#796d80]">
              <WishCategoryIcon
                category={wish.category_slug}
                className="size-3.5 text-[#8753e6]"
              />
              <span>
                {wish.visibility === "private" ? "Личное желание" : "Твоя история"}
              </span>
            </span>
          )}
          {wish.estimated_cost_minor && (
            <small className="mt-1 block text-[9px] font-bold text-[#9a7a52]">
              ~ {formatRubles(wish.estimated_cost_minor)}
            </small>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-[#a295a8]" />
      </Link>
      <div className="border-[#2c2036]/7 mt-3 flex items-center justify-between border-t pt-2.5">
        {editable ? (
          <Link
            className="inline-flex items-center gap-1 text-[10px] font-black text-[#8753e6]"
            href={`/wishes/${wish.id}/edit` as Route}
          >
            Редактировать <ChevronRight className="size-3" />
          </Link>
        ) : (
          <span className="text-[10px] text-[#8d8094]">Открытая история</span>
        )}
        {!ownList && (
          <FeedWishToggle
            initialActive={wish.userWantsIt}
            initialCount={wish.also_wants_count ?? 0}
            wishId={wish.id}
          />
        )}
      </div>
    </article>
  );
}

export default async function WishesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; author?: string }>;
}) {
  const { scope: rawScope = "mine", author: rawAuthor = "" } = await searchParams;
  const scope = SCOPES.some((item) => item.key === rawScope)
    ? (rawScope as WishScope)
    : "mine";
  const authorUsername = rawAuthor.trim().toLowerCase().slice(0, 30);
  const hasAuthorFilter = Boolean(authorUsername);
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id, city")
    .eq("id", user.id)
    .maybeSingle();

  const { data: profileListOwner } = authorUsername
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("username", authorUsername)
        .maybeSingle()
    : { data: null };
  const isOwnProfileList = profileListOwner?.id === user.id;

  const authorListUnavailable = hasAuthorFilter && !profileListOwner;
  let wishes: WishRow[] = [];
  if (profileListOwner) {
    let listQuery = supabase
      .from("wishes")
      .select(
        "id, author_id, title, description, image_path, estimated_cost_minor, category_slug, visibility, also_wants_count, created_at",
      )
      .eq("author_id", profileListOwner.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(80);
    if (!isOwnProfileList) listQuery = listQuery.eq("visibility", "public");
    const { data } = await listQuery;
    wishes = (data ?? []) as WishRow[];
  } else if (!hasAuthorFilter && scope === "mine") {
    const { data } = await supabase
      .from("wishes")
      .select(
        "id, author_id, title, description, image_path, estimated_cost_minor, category_slug, visibility, also_wants_count, created_at",
      )
      .eq("author_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(80);
    wishes = (data ?? []) as WishRow[];
  } else if (scope === "city" && profile?.city_id) {
    const { data: rawPeople } = await supabase
      .from("public_city_people")
      .select("id")
      .eq("city_id", profile.city_id)
      .limit(200);
    const cityPersonIds = (rawPeople ?? []).map((person) => person.id);
    if (cityPersonIds.length > 0) {
      const { data } = await supabase
        .from("wishes")
        .select(
          "id, author_id, title, description, image_path, estimated_cost_minor, category_slug, visibility, also_wants_count, created_at",
        )
        .in("author_id", cityPersonIds)
        .eq("visibility", "public")
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(80);
      wishes = (data ?? []) as WishRow[];
    }
  } else if (scope === "platform") {
    const { data } = await supabase
      .from("wishes")
      .select(
        "id, author_id, title, description, image_path, estimated_cost_minor, category_slug, visibility, also_wants_count, created_at",
      )
      .eq("visibility", "public")
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(80);
    wishes = (data ?? []) as WishRow[];
  }

  const wishIds = wishes.map((wish) => wish.id);
  const authorIds = [...new Set(wishes.map((wish) => wish.author_id))];
  const [authorResult, ownWantsResult] = await Promise.all([
    authorIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, username, display_name, avatar_path")
          .in("id", authorIds)
      : Promise.resolve({ data: [] as AuthorRow[] }),
    wishIds.length > 0 && scope !== "mine"
      ? supabase
          .from("wish_also_wants")
          .select("wish_id")
          .eq("profile_id", user.id)
          .in("wish_id", wishIds)
      : Promise.resolve({ data: [] as Array<{ wish_id: string }> }),
  ]);
  const authorsById = new Map(
    ((authorResult.data ?? []) as AuthorRow[]).map((author) => [author.id, author]),
  );
  const ownWishIds = new Set((ownWantsResult.data ?? []).map((item) => item.wish_id));

  const cards: WishCard[] = await Promise.all(
    wishes.map(async (wish) => {
      const author = authorsById.get(wish.author_id);
      return {
        ...wish,
        imageUrl: await getSignedImageUrl({
          bucket: "wish-media",
          path: wish.image_path,
        }),
        author: author
          ? {
              username: author.username,
              displayName: author.display_name,
              avatarUrl: await getSignedImageUrl({
                bucket: "avatars",
                path: author.avatar_path,
              }),
            }
          : null,
        userWantsIt: ownWishIds.has(wish.id),
        isOwn: wish.author_id === user.id,
      };
    }),
  );

  const title =
    scope === "mine"
      ? "Твои желания"
      : scope === "city"
        ? "Желания города"
        : "Желания людей";
  const subtitle =
    scope === "mine"
      ? "То, к чему хочется прийти и чем можно поделиться."
      : scope === "city"
        ? `Истории людей из ${profile?.city ?? "твоего города"}.`
        : "Публичные истории со всей платформы.";
  const hasCity = Boolean(profile?.city_id);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться в ленту"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/feed"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Хочу также
          </small>
          <h1 className="mt-0.5 text-sm font-black">Желания</h1>
        </span>
        <Link
          aria-label="Создать желание"
          className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-white shadow-[0_7px_16px_rgba(160,75,213,.24)]"
          href="/wishes/new"
        >
          <Plus className="size-5" />
        </Link>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#fff0f7] via-[#f6edff] to-[#eaf5ff] p-5 shadow-[0_14px_32px_rgba(69,43,94,.1)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8753e6]">
          <Heart className="size-3.5" /> Не список покупок
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.07em]">
          {title}.
        </h2>
        <p className="max-w-70 mt-3 text-[11px] leading-5 text-[#756a7d]">{subtitle}</p>
        {!hasAuthorFilter && scope === "mine" && (
          <Link
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-3.5 py-2.5 text-[10px] font-black text-white shadow-[0_7px_16px_rgba(160,75,213,.18)]"
            href="/wishes/new"
          >
            <Plus className="size-3.5" /> Добавить желание
          </Link>
        )}
      </section>

      {profileListOwner ? (
        <nav className="mt-5 flex items-center justify-between rounded-2xl bg-[#eee8f4] p-1 text-[10px] font-black">
          <Link
            className="rounded-xl bg-white px-3 py-2.5 text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]"
            href="/wishes"
          >
            Мои желания
          </Link>
          <span className="px-3 text-[#82758a]">Открытый список</span>
        </nav>
      ) : (
        <nav className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-[#ebe5f1] p-1 text-center text-[10px] font-black">
          {SCOPES.map((item) => (
            <Link
              className={`rounded-xl px-2 py-2.5 transition ${
                scope === item.key
                  ? "bg-white text-[#7549d0] shadow-[0_3px_10px_rgba(65,43,89,.08)]"
                  : "text-[#82758a]"
              }`}
              href={`/wishes?scope=${item.key}`}
              key={item.key}
            >
              {item.key === "city" && <MapPin className="mr-1 inline size-3" />}
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {scope === "city" && !hasCity ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <MapPin className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            Сначала выбери город
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            Тогда здесь появятся публичные желания людей из твоей городской сцены.
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#8753e6]"
            href="/settings"
          >
            Выбрать город <ChevronRight className="size-4" />
          </Link>
        </section>
      ) : cards.length === 0 ? (
        <section className="mt-6 rounded-[1.6rem] border border-dashed border-[#cdbbe7] bg-[#fffcff] p-5 text-center shadow-[0_8px_22px_rgba(69,43,94,.04)]">
          <Sparkles className="mx-auto size-7 text-[#8753e6]" />
          <h2 className="mt-3 text-lg font-black tracking-[-0.045em]">
            {profileListOwner
              ? "Пока нет открытых желаний"
              : scope === "mine"
                ? "Начни с одного желания"
                : "Истории только собираются"}
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#756a7d]">
            {authorListUnavailable
              ? "Можно вернуться к своим желаниям или открыть публичные истории города."
              : profileListOwner
                ? "Когда человек откроет желание в профиле, оно появится здесь."
                : scope === "mine"
                  ? "Не обязательно превращать желание в сбор. Сначала просто сохрани то, что тебе важно."
                  : "Здесь появляются только реальные публичные желания — без выдуманных карточек."}
          </p>
          {!hasAuthorFilter && scope === "mine" && (
            <Link
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] px-4 py-2.5 text-xs font-black text-white"
              href="/wishes/new"
            >
              <Plus className="size-4" /> Добавить желание
            </Link>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <span>
              <h2 className="text-sm font-black">
                {scope === "mine" ? "Твой список" : "Открытые желания"}
              </h2>
              <p className="mt-0.5 text-[10px] text-[#82758a]">
                {scope === "mine"
                  ? "Публичные и личные — личные видны только тебе"
                  : "Можно посмотреть историю или отметить «Хочу также"}
              </p>
            </span>
            <span className="rounded-full bg-[#efe9f6] px-2 py-1 text-[9px] font-black text-[#7a6688]">
              {cards.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {cards.map((wish) => (
              <WishListCard
                key={wish.id}
                ownList={scope === "mine" || isOwnProfileList}
                wish={wish}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 flex gap-2.5 rounded-2xl bg-[#f0faf5] p-3.5 text-[#4c7169]">
        <Check className="mt-0.5 size-4 shrink-0 text-[#258b82]" />
        <p className="text-[10px] leading-4">
          Личное желание видишь только ты. Публичное можно показать в профиле, обсудить
          или однажды превратить в сбор — но это всегда разные добровольные действия.
        </p>
      </section>
    </main>
  );
}
