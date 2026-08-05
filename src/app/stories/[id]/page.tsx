import Link from "next/link";
import { LockKeyhole, Play, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { testUnlockStory } from "@/app/stories/actions";
import { formatRubles } from "@/lib/money";
import { getSignedImageUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", story.author_id)
    .maybeSingle();
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
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
      <section className="surface w-full overflow-hidden rounded-[2rem]">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-bold">{author?.display_name ?? "Автор"}</p>
            <p className="text-xs text-[#8e747c]">Story до {expiry}</p>
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
          <p className="p-4 text-sm leading-6 text-[#604a52]">{story.caption}</p>
        )}
      </section>
    </main>
  );
}
