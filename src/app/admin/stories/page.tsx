import Link from "next/link";
import type { Route } from "next";
import { Clapperboard, ShieldAlert } from "lucide-react";

import { dismissStoryReports, hideReportedStory } from "@/app/admin/stories/actions";
import { EmptyState } from "@/components/empty-state";
import { AdminNav } from "@/components/admin-nav";
import { requireModerator } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/media";

export const metadata = {
  title: "Модерация видео",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  fraud: "Мошенничество",
  prohibited_content: "Запрещённый контент",
  false_information: "Ложная информация",
  spam: "Спам",
  inappropriate_content: "Неприемлемый контент",
  other: "Другое",
};

type ReportedStory = {
  id: string;
  author_id: string;
  caption: string | null;
  media_path: string;
  access_type: "free" | "paid";
  unlock_price_minor: number | null;
  created_at: string;
  reports: Array<{ reason: string; created_at: string }>;
};

export default async function AdminStoriesPage() {
  const { supabase, role } = await requireModerator();

  // Reactive moderation: stories that have open reports.
  const { data: rawReports } = await supabase
    .from("reports")
    .select("target_id, reason, created_at")
    .eq("target_type", "story")
    .in("status", ["open", "in_review"])
    .order("created_at", { ascending: true });
  const reportsByStory = new Map<
    string,
    Array<{ reason: string; created_at: string }>
  >();
  for (const report of rawReports ?? []) {
    const list = reportsByStory.get(report.target_id) ?? [];
    list.push({ reason: report.reason, created_at: report.created_at });
    reportsByStory.set(report.target_id, list);
  }
  const storyIds = [...reportsByStory.keys()];

  let stories: ReportedStory[] = [];
  let authors = new Map<string, { username: string; display_name: string }>();
  if (storyIds.length > 0) {
    const { data: rawStories } = await supabase
      .from("stories")
      .select(
        "id, author_id, caption, media_path, access_type, unlock_price_minor, created_at",
      )
      .in("id", storyIds)
      .order("created_at", { ascending: false });
    stories = ((rawStories ?? []) as Array<Omit<ReportedStory, "reports">>).map(
      (story) => ({ ...story, reports: reportsByStory.get(story.id) ?? [] }),
    );

    const authorIds = [...new Set(stories.map((story) => story.author_id))];
    const { data: authorProfiles } = authorIds.length
      ? await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", authorIds)
      : { data: [] };
    authors = new Map((authorProfiles ?? []).map((profile) => [profile.id, profile]));
  }

  const storiesWithUrl = await Promise.all(
    stories.map(async (story) => ({
      ...story,
      videoUrl: await getSignedImageUrl({
        bucket: "story-media",
        path: story.media_path,
      }),
    })),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Модерация видео
          </h1>
          <p className="mt-1 text-sm text-[#8e6a75]">
            Stories публикуются сразу; сюда попадают только те, на которые поступили
            жалобы.
          </p>
        </div>
        <ShieldAlert className="mb-2 hidden size-8 text-[#d34872] sm:block" />
      </div>

      <AdminNav active="/admin/stories" />

      <section className="mt-8">
        {storiesWithUrl.length === 0 ? (
          <EmptyState
            actionHref="/admin/reports"
            actionLabel="К жалобам"
            description="Видео с открытыми жалобами появятся здесь."
            title="Жалоб на видео нет"
          />
        ) : (
          <div className="space-y-4">
            {storiesWithUrl.map((story) => {
              const author = authors.get(story.author_id);
              const createdAt = new Intl.DateTimeFormat("ru-RU", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(story.created_at));
              return (
                <article className="surface overflow-hidden rounded-2xl" key={story.id}>
                  <div className="flex flex-col gap-4 p-5 sm:flex-row">
                    <div className="w-full shrink-0 sm:w-40">
                      {story.videoUrl ? (
                        <video
                          className="aspect-[9/16] w-full rounded-xl bg-black object-contain"
                          controls
                          playsInline
                          preload="metadata"
                          src={story.videoUrl}
                        />
                      ) : (
                        <div className="grid aspect-[9/16] w-full place-items-center rounded-xl bg-[#f5e9ed] text-[#bd3e66]">
                          <Clapperboard className="size-8" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-[#bd3e66]">
                          {story.access_type === "paid"
                            ? `Платная · ${(story.unlock_price_minor ?? 0) / 100} ₽`
                            : "Бесплатная"}
                        </span>
                        <span className="rounded-full bg-[#fce5ec] px-2.5 py-1 text-xs font-semibold text-[#bd3e66]">
                          {story.reports.length} жалоб
                        </span>
                        <span className="ml-auto text-xs text-[#9b858c]">
                          {createdAt}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {story.reports.map((report, index) => (
                          <span
                            className="rounded-full bg-[#f1e8f0] px-2 py-0.5 text-[10px] font-semibold text-[#7a4d6e]"
                            key={index}
                          >
                            {REASON_LABELS[report.reason] ?? report.reason}
                          </span>
                        ))}
                      </div>
                      <h2 className="mt-3 font-bold">
                        {author?.display_name ?? "Автор"}
                      </h2>
                      {author && (
                        <Link
                          className="text-sm font-semibold text-[#bd3e66]"
                          href={`/u/${author.username}` as Route}
                        >
                          @{author.username}
                        </Link>
                      )}
                      {story.caption && (
                        <p className="mt-3 text-sm leading-6 text-[#604a52]">
                          {story.caption}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <form action={hideReportedStory}>
                          <input name="story_id" type="hidden" value={story.id} />
                          <input
                            className="h-9 w-44 rounded-lg border border-[#ead9df] bg-white px-3 text-sm text-[#765f66]"
                            maxLength={500}
                            name="moderation_note"
                            placeholder="Причина скрытия"
                          />
                          <button
                            className="ml-1 h-9 rounded-lg bg-[#df4f7d] px-4 text-sm font-semibold text-white"
                            type="submit"
                          >
                            Скрыть story
                          </button>
                        </form>
                        <form action={dismissStoryReports}>
                          <input name="story_id" type="hidden" value={story.id} />
                          <button
                            className="h-9 rounded-lg border border-[#ead9df] bg-white px-3 text-sm font-semibold text-[#765f66]"
                            type="submit"
                          >
                            Жалобы ложные — оставить
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <Link className="mt-8 inline-block text-sm font-semibold text-[#a13d5e]" href="/">
        ← К ленте
      </Link>
    </main>
  );
}
