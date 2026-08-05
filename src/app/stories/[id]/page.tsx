import Link from "next/link";
import { LockKeyhole, Play, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { sendTestStoryGift } from "@/app/stories/gifts/actions";
import { testUnlockStory } from "@/app/stories/actions";
import { formatRubles } from "@/lib/money";
import { getSignedImageUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

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
  const [{ data: author }, { data: gifts }, { data: storyGifts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name")
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
  ]);
  const videoUrl = canWatch
    ? await getSignedImageUrl({ bucket: "story-media", path: story.media_path })
    : null;
  const expiry = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(story.expires_at));

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center bg-[#0c0e14] px-4 py-8 text-white">
      <section className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#171923] shadow-[0_18px_60px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-bold">{author?.display_name ?? "Автор"}</p>
            <p className="text-xs text-[#b9b2c7]">Story до {expiry}</p>
          </div>
          {author?.username && (
            <Link
              className="text-sm font-semibold text-[#a13d5e]"
              href={`/u/${author.username}`}
            >
              Профиль
            </Link>
          )}
        </div>
        <div className="relative aspect-[9/16] max-h-[70vh] bg-[#2e2025]">
          {canWatch && videoUrl ? (
            <video
              autoPlay
              className="size-full object-contain"
              controls
              playsInline
              src={videoUrl}
            />
          ) : (
            <div className="grid size-full place-items-center p-6 text-center text-white">
              <div>
                <LockKeyhole className="mx-auto size-10" />
                <h1 className="mt-4 text-xl font-bold">Закрытая story</h1>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Откройте короткое видео автора и поддержите его первые публикации.
                </p>
                {story.unlock_price_minor && (
                  <p className="mt-4 text-2xl font-bold">
                    {formatRubles(story.unlock_price_minor)}
                  </p>
                )}
                {user ? (
                  <form action={testUnlockStory} className="mt-5">
                    <input name="story_id" type="hidden" value={story.id} />
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#df4f7d] px-5 text-sm font-semibold text-white"
                      type="submit"
                    >
                      <Sparkles className="size-4" /> Открыть в тестовом режиме
                    </button>
                  </form>
                ) : (
                  <Link
                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#df4f7d] px-5 text-sm font-semibold text-white"
                    href="/auth/sign-in"
                  >
                    <Play className="size-4" /> Войти и открыть
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
        {story.caption && (
          <p className="p-4 text-sm leading-6 text-[#ddd5e6]">{story.caption}</p>
        )}
        {canWatch && user && !isAuthor && gifts && gifts.length > 0 && (
          <section className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Отправить подарок</p>
              <span className="text-xs text-[#b9b2c7]">
                {storyGifts?.length ?? 0} подарков
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {gifts.map((gift) => (
                <form action={sendTestStoryGift} key={gift.code}>
                  <input name="story_id" type="hidden" value={story.id} />
                  <input name="gift_code" type="hidden" value={gift.code} />
                  <button
                    className="flex w-full flex-col items-center rounded-xl border border-white/10 bg-white/5 px-1 py-2 transition hover:border-[#ff77ba] hover:bg-[#2b1933]"
                    type="submit"
                  >
                    <span className="text-2xl">{gift.emoji}</span>
                    <span className="mt-1 text-[10px] text-[#d7cfdf]">
                      {gift.label}
                    </span>
                    <span className="text-[10px] text-[#ffb7dd]">
                      {formatRubles(gift.price_minor)}
                    </span>
                  </button>
                </form>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#9f97aa]">
              Подарки работают в тестовом режиме и формируют тестовый доход автора.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
