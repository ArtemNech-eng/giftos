import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { formatRubles } from "@/lib/money";
import { EmptyState } from "@/components/empty-state";

export const metadata = {
  title: "Мои открытия",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MyStoryOpensPage() {
  const { supabase, user } = await requireUser();
  const { data: rawOpens } = await supabase
    .from("story_unlocks")
    .select("id, unlocked_at, stories!inner(id, caption, unlock_price_minor)")
    .eq("viewer_id", user.id)
    .eq("status", "unlocked")
    .order("unlocked_at", { ascending: false })
    .limit(50);
  const opens = (
    (rawOpens ?? []) as Array<{
      id: string;
      unlocked_at: string | null;
      stories: Array<{
        id: string;
        caption: string | null;
        unlock_price_minor: number | null;
      }>;
    }>
  ).flatMap((row) =>
    row.stories?.[0]
      ? [
          {
            id: row.id,
            story: row.stories[0],
            unlocked_at: row.unlocked_at,
          },
        ]
      : [],
  );

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href="/feed"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Мои открытия</h1>
        <span className="w-9" />
      </header>

      <section className="mt-6">
        {opens.length === 0 ? (
          <EmptyState
            actionHref="/feed"
            actionLabel="К ленте"
            description="Открытые платные stories появятся здесь."
            title="Пока пусто"
          />
        ) : (
          <div className="space-y-2">
            {opens.map((open) => (
              <Link
                className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#171923] p-3"
                href={`/stories/${open.story?.id}`}
                key={open.id}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e17dff] to-[#9e88ff]">
                  <LockKeyhole className="size-5 text-white" />
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-sm font-bold">
                    {open.story?.caption ?? "Video story"}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#a9a1b4]">
                    {open.story?.unlock_price_minor
                      ? `${formatRubles(open.story.unlock_price_minor)}`
                      : "Платная story"}
                    {open.unlocked_at
                      ? ` · ${new Intl.DateTimeFormat("ru-RU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(open.unlocked_at))}`
                      : ""}
                  </span>
                </span>
                <span className="text-xs text-[#e17dff]">Открыто ›</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
