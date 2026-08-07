import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { formatRubles } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/empty-state";

export const metadata = {
  title: "Мои открытия",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MyStoryOpensPage() {
  const { user } = await requireUser();
  // Admin client on purpose: RLS only exposes non-expired stories, but the
  // opens history must keep expired stories too. Strictly scoped to the
  // current user's own unlocks.
  const admin = createAdminClient();
  const { data: rawOpens } = await admin
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
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
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
            Ваши открытия
          </small>
          <h1 className="mt-0.5 text-sm font-black">Мои открытия</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <LockKeyhole className="size-4.5" />
        </span>
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
                className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                href={`/stories/${open.story?.id}`}
                key={open.id}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e17dff] to-[#9e88ff]">
                  <LockKeyhole className="size-5 text-white" />
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-xs font-black">
                    {open.story?.caption ?? "Video story"}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#81748a]">
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
                <span className="text-[10px] font-black text-[#7549d0]">Открыто ›</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
