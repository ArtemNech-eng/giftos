import Link from "next/link";
import type { Route } from "next";

import { getSignedImageUrl } from "@/lib/media";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function StoryStrip() {
  if (!hasSupabaseEnvironment()) return null;

  const supabase = await createClient();
  const { data: rawStories } = await supabase
    .from("stories")
    .select("id, author_id, created_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(30);
  const newestByAuthor = new Map<string, { id: string; author_id: string }>();
  for (const story of rawStories ?? []) {
    if (!newestByAuthor.has(story.author_id))
      newestByAuthor.set(story.author_id, story);
  }
  const stories = [...newestByAuthor.values()].slice(0, 12);
  if (stories.length === 0) return null;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path")
    .in(
      "id",
      stories.map((story) => story.author_id),
    );
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const items = await Promise.all(
    stories.map(async (story) => {
      const author = profileById.get(story.author_id);
      if (!author) return null;
      return {
        storyId: story.id,
        name: author.display_name,
        avatarUrl: await getSignedImageUrl({
          bucket: "avatars",
          path: author.avatar_path,
        }),
      };
    }),
  );

  return (
    <section className="mb-6 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-3">
        {items.filter(Boolean).map(
          (item) =>
            item && (
              <Link
                className="group flex w-16 flex-col items-center gap-1.5"
                href={`/stories/${item.storyId}` as Route}
                key={item.storyId}
              >
                <span className="grid size-14 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#df4f7d] via-[#f2a46c] to-[#ffd88c] p-0.5">
                  <span className="grid size-full place-items-center overflow-hidden rounded-full bg-[#f4d0d9] text-sm font-bold text-[#70444f]">
                    {item.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL has no stable host
                      <img
                        loading="lazy"
                        decoding="async"
                        alt=""
                        className="size-full object-cover"
                        src={item.avatarUrl}
                      />
                    ) : (
                      item.name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                </span>
                <span className="w-16 truncate text-center text-xs font-medium text-[#725c63] group-hover:text-[#bd3e66]">
                  {item.name}
                </span>
              </Link>
            ),
        )}
      </div>
    </section>
  );
}
