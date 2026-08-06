import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, Eye } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/empty-state";

export const metadata = {
  title: "Мои просмотры",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MyStoryViewsPage() {
  const { user } = await requireUser();
  // Admin client on purpose: RLS only exposes non-expired stories, but the
  // viewing history must keep expired stories too. The query is strictly
  // scoped to the current user's own views.
  const admin = createAdminClient();
  const { data: rawViews } = await admin
    .from("story_views")
    .select(
      "story_id, viewed_at, stories!inner(id, caption, author_id, profiles!inner(id, display_name, username))",
    )
    .eq("viewer_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(50);
  const views = (
    (rawViews ?? []) as Array<{
      story_id: string;
      viewed_at: string;
      stories: Array<{
        id: string;
        caption: string | null;
        author_id: string;
        profiles: Array<{
          id: string;
          display_name: string;
          username: string;
        }>;
      }>;
    }>
  ).flatMap((row) => {
    const story = row.stories?.[0];
    const author = story?.profiles?.[0];
    return story && author
      ? [
          {
            storyId: row.story_id,
            viewedAt: row.viewed_at,
            story,
            author,
          },
        ]
      : [];
  });

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/feed"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Мои просмотры</h1>
        <span className="w-9" />
      </header>

      <section className="mt-6">
        {views.length === 0 ? (
          <EmptyState
            actionHref="/feed"
            actionLabel="К ленте"
            description="Просмотренные stories появятся здесь."
            title="Пока пусто"
          />
        ) : (
          <div className="space-y-2">
            {views.map((view) => (
              <Link
                className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#171923] p-3"
                href={`/stories/${view.storyId}` as Route}
                key={view.storyId}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#9e88ff] to-[#4bc9ff]">
                  <Eye className="size-5 text-white" />
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-sm font-bold">
                    {view.story.caption ?? "Video story"}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#a9a1b4]">
                    {view.author.display_name} · @{view.author.username}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-[#a9a1b4]">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(view.viewedAt))}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
