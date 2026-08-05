import Link from "next/link";
import type { Route } from "next";
import { MapPin, UserPlus } from "lucide-react";
import { notFound } from "next/navigation";

import { deleteProfileMedia, uploadProfileMedia } from "@/app/profile/media/actions";
import { createStory } from "@/app/stories/actions";
import { blockUser, unblockUser } from "@/app/safety/actions";
import { toggleUserFollow } from "@/app/social/actions";
import { EmptyState } from "@/components/empty-state";
import { ReportForm } from "@/components/report-form";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES } from "@/lib/constants";
import { getSignedImageUrl } from "@/lib/media";
import { formatRubles } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
      "id, username, display_name, bio, city, show_city, avatar_path, is_creator, creator_headline, created_at",
    )
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;
  const { data: existingFollow } =
    user && !isOwnProfile
      ? await supabase
          .from("user_follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : { data: null };
  const { data: existingBlock } =
    user && !isOwnProfile
      ? await supabase
          .from("blocks")
          .select("blocker_id")
          .eq("blocker_id", user.id)
          .eq("blocked_id", profile.id)
          .maybeSingle()
      : { data: null };

  const avatarUrl = await getSignedImageUrl({
    bucket: "avatars",
    path: profile.avatar_path,
  });
  const { data: rawGallery } = await supabase
    .from("profile_media")
    .select("id, storage_path, visibility, sort_order")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true });
  const gallery = await Promise.all(
    (rawGallery ?? []).map(async (media) => ({
      ...media,
      url: await getSignedImageUrl({
        bucket: "profile-media",
        path: media.storage_path,
      }),
    })),
  );

  const [
    { data: wishes },
    { data: fundraisers },
    { data: interests },
    { count: followers },
  ] = await Promise.all([
    supabase
      .from("wishes")
      .select("id, title, description, estimated_cost_minor, category_slug, created_at")
      .eq("author_id", profile.id)
      .eq("visibility", "public")
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("fundraisers")
      .select(
        "id, slug, title, target_amount_minor, current_amount_minor, participant_count, category_slug, status",
      )
      .eq("author_id", profile.id)
      .eq("visibility", "public")
      .in("status", ["active", "goal_reached"])
      .order("published_at", { ascending: false }),
    supabase
      .from("profile_interests")
      .select("category_slug")
      .eq("profile_id", profile.id),
    supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
  ]);

  const interestItems = (interests ?? [])
    .map((interest) =>
      CATEGORIES.find((category) => category.slug === interest.category_slug),
    )
    .filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="surface overflow-hidden rounded-[2rem]">
          <div className="h-28 bg-gradient-to-r from-[#f8c2d1] via-[#f9d8bf] to-[#f7e6aa]" />
          <div className="px-5 pb-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <span className="-mt-10 grid size-20 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-[#d9acb9] text-2xl font-bold text-white shadow-sm">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL has no stable host for Image config
                  <img
                    alt={`Аватар ${profile.display_name}`}
                    className="size-full object-cover"
                    src={avatarUrl}
                  />
                ) : (
                  profile.display_name.slice(0, 1).toUpperCase()
                )}
              </span>
              <div className="flex items-center gap-2 sm:mb-1">
                {user && !isOwnProfile ? (
                  <>
                    <form action={toggleUserFollow}>
                      <input name="profile_id" type="hidden" value={profile.id} />
                      <input name="username" type="hidden" value={profile.username} />
                      <button
                        className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${existingFollow ? "border border-[#ead9df] bg-white text-[#765f66] hover:border-[#df4f7d]" : "bg-[#df4f7d] text-white hover:bg-[#c93f6d]"}`}
                        type="submit"
                      >
                        <UserPlus className="size-4" />
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
                        className="h-10 rounded-xl px-2.5 text-sm font-semibold text-[#8e747c] transition hover:bg-rose-50 hover:text-[#bd3e66]"
                        type="submit"
                      >
                        {existingBlock ? "Разблокировать" : "Блок"}
                      </button>
                    </form>
                    <ReportForm
                      returnTo={`/u/${profile.username}`}
                      targetId={profile.id}
                      targetType="profile"
                    />
                  </>
                ) : !user ? (
                  <Link
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
                    href="/auth/sign-in"
                  >
                    <UserPlus className="size-4" /> Подписаться
                  </Link>
                ) : null}
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              {profile.display_name}
            </h1>
            <p className="mt-1 text-sm text-[#886f77]">
              @{profile.username}
              {profile.show_city && profile.city ? (
                <span className="ml-2 inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {profile.city}
                </span>
              ) : null}
            </p>
            {profile.creator_headline && (
              <p className="mt-4 text-base font-semibold text-[#5a3e47]">
                {profile.creator_headline}
              </p>
            )}
            {profile.bio && (
              <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-[#654e55]">
                {profile.bio}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#755e65]">
              <span>
                <b className="text-[#3f2c33]">{followers ?? 0}</b> подписчиков
              </span>
              <span>
                <b className="text-[#3f2c33]">{wishes?.length ?? 0}</b> желаний
              </span>
              <span>
                <b className="text-[#3f2c33]">{fundraisers?.length ?? 0}</b> активных
                сборов
              </span>
            </div>
            {interestItems.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {interestItems.map(
                  (item) =>
                    item && (
                      <span
                        className="rounded-full bg-[#fff1f4] px-3 py-1.5 text-xs font-semibold text-[#a34c67]"
                        key={item.slug}
                      >
                        {item.emoji} {item.label}
                      </span>
                    ),
                )}
              </div>
            )}
          </div>
        </section>

        {(gallery.length > 0 || isOwnProfile) && (
          <section className="surface mt-6 rounded-2xl p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#bd3e66]">Личный контекст</p>
                <h2 className="mt-1 text-xl font-bold">Фотографии</h2>
              </div>
              <span className="text-xs text-[#8e747c]">{gallery.length} / 6</span>
            </div>
            {gallery.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((media) => (
                  <figure
                    className="group relative aspect-square overflow-hidden rounded-xl bg-[#f7e8ec]"
                    key={media.id}
                  >
                    {media.url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL has no stable image host
                      <img
                        alt={`Фотография ${profile.display_name}`}
                        className="size-full object-cover"
                        src={media.url}
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-sm text-[#9b858c]">
                        Фото недоступно
                      </span>
                    )}
                    {isOwnProfile && (
                      <form
                        action={deleteProfileMedia}
                        className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
                      >
                        <input name="media_id" type="hidden" value={media.id} />
                        <input name="username" type="hidden" value={profile.username} />
                        <button
                          className="rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white"
                          type="submit"
                        >
                          Удалить
                        </button>
                      </form>
                    )}
                  </figure>
                ))}
              </div>
            )}
            {isOwnProfile && gallery.length < 6 && (
              <form
                action={uploadProfileMedia}
                className="mt-5 rounded-xl border border-dashed border-[#ead9df] bg-[#fffafb] p-4"
                encType="multipart/form-data"
              >
                <input name="username" type="hidden" value={profile.username} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="grow text-sm font-semibold text-[#5c464d]">
                    Добавить фотографии
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="mt-2 block w-full text-sm text-[#725c63] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fce5ec] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#bd3e66] hover:file:bg-[#f8d9e4]"
                      multiple
                      name="photos"
                      type="file"
                    />
                  </label>
                  <label className="text-sm font-semibold text-[#5c464d]">
                    Видимость
                    <select
                      className="mt-2 block h-9 rounded-lg border border-[#e7d8dc] bg-white px-2 text-sm font-normal"
                      defaultValue="public"
                      name="visibility"
                    >
                      <option value="public">Публично</option>
                      <option value="private">Только я</option>
                    </select>
                  </label>
                  <button
                    className="h-10 rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
                    type="submit"
                  >
                    Загрузить
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#9b858c]">
                  До шести фото в профиле. JPG, PNG или WebP, до 10 МБ каждое.
                </p>
              </form>
            )}
          </section>
        )}

        {isOwnProfile && profile.is_creator && (
          <section className="surface mt-6 rounded-2xl p-5 sm:p-6">
            <p className="text-sm font-semibold text-[#bd3e66]">Контент автора</p>
            <h2 className="mt-1 text-xl font-bold">Новая video story</h2>
            <p className="mt-2 text-sm leading-6 text-[#826c73]">
              Короткое вертикальное видео будет доступно 24 часа. Платное открытие пока
              работает в тестовом режиме.
            </p>
            <form action={createStory} className="mt-5" encType="multipart/form-data">
              <input name="username" type="hidden" value={profile.username} />
              <label className="block text-sm font-semibold text-[#5c464d]">
                Видео
                <input
                  accept="video/mp4,video/webm"
                  className="mt-2 block w-full text-sm text-[#725c63] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fce5ec] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#bd3e66] hover:file:bg-[#f8d9e4]"
                  name="video"
                  required
                  type="file"
                />
              </label>
              <textarea
                className="mt-4 min-h-20 w-full rounded-xl border border-[#e7d8dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#df4f7d] focus:ring-4 focus:ring-[#df4f7d]/10"
                maxLength={500}
                name="caption"
                placeholder="Подпись к story"
              />
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="text-sm font-semibold text-[#5c464d]">
                  Доступ
                  <select
                    className="mt-2 block h-9 rounded-lg border border-[#e7d8dc] bg-white px-2 text-sm font-normal"
                    defaultValue="free"
                    name="access_type"
                  >
                    <option value="free">Бесплатно</option>
                    <option value="paid">Платное открытие</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-[#5c464d]">
                  Цена, ₽
                  <input
                    className="mt-2 block h-9 w-28 rounded-lg border border-[#e7d8dc] bg-white px-2 text-sm font-normal"
                    inputMode="decimal"
                    min="1"
                    name="unlock_price"
                    placeholder="49"
                    type="number"
                  />
                </label>
                <button
                  className="h-10 rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
                  type="submit"
                >
                  Опубликовать
                </button>
              </div>
              <p className="mt-2 text-xs text-[#9b858c]">
                MP4 или WebM, до 50 МБ. Видео до 60 секунд рекомендуется для первой
                версии.
              </p>
            </form>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-[#bd3e66]">
                Мечты {profile.display_name}
              </p>
              <h2 className="mt-1 text-2xl font-bold">Желания</h2>
            </div>
          </div>
          {(wishes?.length ?? 0) > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishes!.map((wish) => {
                const category =
                  CATEGORIES.find((item) => item.slug === wish.category_slug) ??
                  CATEGORIES.at(-1)!;
                return (
                  <Link
                    className="surface rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                    href={`/wishes/${wish.id}` as Route}
                    key={wish.id}
                  >
                    <span className="text-3xl">{category.emoji}</span>
                    <p className="mt-4 font-bold">{wish.title}</p>
                    {wish.description && (
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#856e75]">
                        {wish.description}
                      </p>
                    )}
                    {wish.estimated_cost_minor && (
                      <p className="mt-3 text-sm font-semibold text-[#c53d68]">
                        ~ {formatRubles(wish.estimated_cost_minor)}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              description="Пока здесь нет публичных желаний."
              title="Желания скоро появятся"
            />
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#bd3e66]">Общие цели</p>
            <h2 className="mt-1 text-2xl font-bold">Активные сборы</h2>
          </div>
          {(fundraisers?.length ?? 0) > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {fundraisers!.map((fundraiser) => {
                const category =
                  CATEGORIES.find((item) => item.slug === fundraiser.category_slug) ??
                  CATEGORIES.at(-1)!;
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
                    className="surface rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                    href={`/fundraisers/${fundraiser.slug}` as Route}
                    key={fundraiser.id}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{category.emoji}</span>
                      <span className="rounded-full bg-[#fce5ec] px-2 py-1 text-xs font-semibold text-[#bd3e66]">
                        {fundraiser.participant_count} участников
                      </span>
                    </div>
                    <p className="mt-4 font-bold">{fundraiser.title}</p>
                    <div className="mt-4 flex justify-between text-sm">
                      <span className="font-bold text-[#c53d68]">
                        {formatRubles(fundraiser.current_amount_minor)}
                      </span>
                      <span className="text-[#8e747c]">
                        из {formatRubles(fundraiser.target_amount_minor)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f6e8ec]">
                      <div
                        className="h-full rounded-full bg-[#df4f7d]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              description="Когда пользователь опубликует сбор, он появится здесь."
              title="Активных сборов пока нет"
            />
          )}
        </section>
      </main>
    </>
  );
}
