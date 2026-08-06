import Link from "next/link";
import { Archive, Inbox, ShieldAlert } from "lucide-react";

import { moderateTarget, resolveReport } from "@/app/admin/reports/actions";
import { EmptyState } from "@/components/empty-state";
import { requireModerator } from "@/lib/auth";

export const metadata = { title: "Модерация", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Report = {
  id: string;
  reporter_id: string;
  target_type:
    | "profile"
    | "wish"
    | "fundraiser"
    | "comment"
    | "message"
    | "story"
    | "wish_comment"
    | "live_room"
    | "place"
    | "place_message"
    | "live_message";
  target_id: string;
  reason: string;
  details: string | null;
  status: "open" | "in_review" | "resolved" | "dismissed";
  resolution_note: string | null;
  created_at: string;
};

const reasonLabels: Record<string, string> = {
  fraud: "Мошенничество",
  prohibited_content: "Запрещённый контент",
  false_information: "Ложная информация",
  spam: "Спам",
  inappropriate_content: "Неприемлемый контент",
  other: "Другое",
};

const targetLabels: Record<string, string> = {
  profile: "профиль",
  wish: "желание",
  fundraiser: "сбор",
  comment: "сообщение",
  message: "сообщение",
  story: "video story",
  wish_comment: "комментарий желания",
  live_room: "эфир",
  place: "место",
  place_message: "сообщение места",
  live_message: "сообщение эфира",
};

function moderationActionFor(type: Report["target_type"]) {
  if (type === "comment") return { value: "hide_comment", label: "Скрыть сообщение" };
  if (type === "wish_comment")
    return { value: "hide_wish_comment", label: "Скрыть комментарий" };
  if (type === "wish") return { value: "hide_wish", label: "Скрыть желание" };
  if (type === "story") return { value: "hide_story", label: "Скрыть story" };
  if (type === "live_room") return { value: "end_live_room", label: "Завершить эфир" };
  if (type === "place") return { value: "hide_place", label: "Скрыть место" };
  if (type === "place_message")
    return { value: "hide_place_message", label: "Скрыть сообщение" };
  if (type === "live_message")
    return { value: "hide_live_message", label: "Скрыть сообщение" };
  if (type === "profile")
    return { value: "suspend_profile", label: "Заблокировать профиль" };
  if (type === "fundraiser")
    return { value: "cancel_fundraiser", label: "Скрыть сбор" };
  return null;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { supabase, role } = await requireModerator();
  const { tab: rawTab = "" } = await searchParams;
  const tab = rawTab === "archive" ? "archive" : "queue";

  const [{ count: openCount }, { data: rawReports }, { count: archiveCount }] =
    await Promise.all([
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_review"]),
      supabase
        .from("reports")
        .select(
          "id, reporter_id, target_type, target_id, reason, details, status, resolution_note, created_at",
        )
        .in(
          "status",
          tab === "archive" ? ["resolved", "dismissed"] : ["open", "in_review"],
        )
        .order("created_at", { ascending: tab === "archive" })
        .limit(100),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .in("status", ["resolved", "dismissed"]),
    ]);

  const reports = (rawReports ?? []) as Report[];

  // Resolve target context: profile names, wish/fundraiser/story/live titles.
  const profiles = new Map<string, string>();
  const wishes = new Map<string, string>();
  const fundraisers = new Map<string, string>();
  const stories = new Map<string, string>();
  const liveRooms = new Map<string, string>();
  const places = new Map<string, string>();
  const liveMessages = new Map<string, string>();
  for (const report of reports) {
    if (report.target_type === "profile") profiles.set(report.target_id, "");
    if (report.target_type === "wish") wishes.set(report.target_id, "");
    if (report.target_type === "fundraiser") fundraisers.set(report.target_id, "");
    if (report.target_type === "story") stories.set(report.target_id, "");
    if (report.target_type === "live_room") liveRooms.set(report.target_id, "");
    if (report.target_type === "place") places.set(report.target_id, "");
    if (report.target_type === "live_message") liveMessages.set(report.target_id, "");
  }
  if (profiles.size > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", [...profiles.keys()]);
    for (const row of data ?? []) profiles.set(row.id, row.display_name);
  }
  if (wishes.size > 0) {
    const { data } = await supabase
      .from("wishes")
      .select("id, title")
      .in("id", [...wishes.keys()]);
    for (const row of data ?? []) wishes.set(row.id, row.title);
  }
  if (fundraisers.size > 0) {
    const { data } = await supabase
      .from("fundraisers")
      .select("id, title")
      .in("id", [...fundraisers.keys()]);
    for (const row of data ?? []) fundraisers.set(row.id, row.title);
  }
  if (stories.size > 0) {
    const { data } = await supabase
      .from("stories")
      .select("id, caption")
      .in("id", [...stories.keys()]);
    for (const row of data ?? []) stories.set(row.id, row.caption ?? "Video story");
  }
  if (liveRooms.size > 0) {
    const { data } = await supabase
      .from("live_rooms")
      .select("id, title")
      .in("id", [...liveRooms.keys()]);
    for (const row of data ?? []) liveRooms.set(row.id, row.title);
  }
  if (places.size > 0) {
    const { data } = await supabase
      .from("places")
      .select("id, name")
      .in("id", [...places.keys()]);
    for (const row of data ?? []) places.set(row.id, row.name);
  }
  if (liveMessages.size > 0) {
    const { data } = await supabase
      .from("live_room_messages")
      .select("id, body")
      .in("id", [...liveMessages.keys()]);
    for (const row of data ?? []) liveMessages.set(row.id, row.body);
  }

  function targetContext(report: Report) {
    if (report.target_type === "profile") return profiles.get(report.target_id) ?? null;
    if (report.target_type === "wish") return wishes.get(report.target_id) ?? null;
    if (report.target_type === "fundraiser")
      return fundraisers.get(report.target_id) ?? null;
    if (report.target_type === "story") return stories.get(report.target_id) ?? null;
    if (report.target_type === "live_room")
      return liveRooms.get(report.target_id) ?? null;
    if (report.target_type === "place") return places.get(report.target_id) ?? null;
    if (report.target_type === "live_message")
      return liveMessages.get(report.target_id) ?? null;
    return null;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Модерация</h1>
        </div>
        <ShieldAlert className="mb-2 hidden size-8 text-[#d34872] sm:block" />
      </div>

      <nav className="mt-6 flex gap-1 rounded-xl bg-[#f5e9ed] p-1">
        <Link
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "queue"
              ? "bg-white text-[#bd3e66] shadow-sm"
              : "text-[#8e6a75] hover:text-[#bd3e66]"
          }`}
          href="/admin/reports"
        >
          <Inbox className="size-4" /> Очередь
          {openCount ? (
            <span className="rounded-full bg-[#df4f7d] px-2 py-0.5 text-xs text-white">
              {openCount}
            </span>
          ) : null}
        </Link>
        <Link
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "archive"
              ? "bg-white text-[#bd3e66] shadow-sm"
              : "text-[#8e6a75] hover:text-[#bd3e66]"
          }`}
          href="/admin/reports?tab=archive"
        >
          <Archive className="size-4" /> Архив
          {archiveCount ? (
            <span className="rounded-full bg-[#e6b8c4] px-2 py-0.5 text-xs text-[#8e4a5e]">
              {archiveCount}
            </span>
          ) : null}
        </Link>
      </nav>

      <section className="mt-8">
        {reports.length === 0 ? (
          <EmptyState
            actionHref="/admin/reports"
            actionLabel="К очереди"
            description={
              tab === "archive"
                ? "Завершённых жалоб пока нет."
                : "Открытых жалоб сейчас нет."
            }
            title={tab === "archive" ? "Архив пуст" : "Очередь пуста"}
          />
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const action = moderationActionFor(report.target_type);
              const createdAt = new Intl.DateTimeFormat("ru-RU", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(report.created_at));
              const context = targetContext(report);
              return (
                <article className="surface rounded-2xl p-5" key={report.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-[#bd3e66]">
                          {reasonLabels[report.reason] ?? report.reason}
                        </span>
                        <span className="rounded-full bg-[#f1e8f0] px-2.5 py-1 text-xs font-semibold text-[#7a4d6e]">
                          {targetLabels[report.target_type] ?? report.target_type}
                        </span>
                        {report.status === "resolved" && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Решено
                          </span>
                        )}
                        {report.status === "dismissed" && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Отклонено
                          </span>
                        )}
                      </div>
                      <h2 className="mt-3 font-bold">
                        Жалоба на{" "}
                        {targetLabels[report.target_type] ?? report.target_type}
                      </h2>
                      {context && (
                        <p className="mt-1 text-sm font-semibold text-[#bd3e66]">
                          {context}
                        </p>
                      )}
                      <p className="mt-1 font-mono text-xs text-[#9b858c]">
                        {report.target_id}
                      </p>
                    </div>
                    <span className="text-xs text-[#9b858c]">{createdAt}</span>
                  </div>
                  {report.details && (
                    <p className="mt-4 rounded-xl bg-[#fff8f9] p-3 text-sm leading-6 text-[#604a52]">
                      {report.details}
                    </p>
                  )}
                  {report.resolution_note && (
                    <p className="mt-3 rounded-xl bg-[#f3faf5] p-3 text-sm leading-6 text-[#3e6b52]">
                      Решение: {report.resolution_note}
                    </p>
                  )}
                  {tab === "queue" && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <form action={resolveReport}>
                        <input name="report_id" type="hidden" value={report.id} />
                        <input name="status" type="hidden" value="dismissed" />
                        <button
                          className="h-9 rounded-lg border border-[#ead9df] bg-white px-3 text-sm font-semibold text-[#765f66]"
                          type="submit"
                        >
                          Отклонить
                        </button>
                      </form>
                      <form action={resolveReport}>
                        <input name="report_id" type="hidden" value={report.id} />
                        <input name="status" type="hidden" value="resolved" />
                        <button
                          className="h-9 rounded-lg bg-[#fce5ec] px-3 text-sm font-semibold text-[#bd3e66]"
                          type="submit"
                        >
                          Закрыть без действия
                        </button>
                      </form>
                      {action && (
                        <form action={moderateTarget}>
                          <input name="report_id" type="hidden" value={report.id} />
                          <input
                            name="target_type"
                            type="hidden"
                            value={report.target_type}
                          />
                          <input
                            name="target_id"
                            type="hidden"
                            value={report.target_id}
                          />
                          <input name="action" type="hidden" value={action.value} />
                          <button
                            className="h-9 rounded-lg bg-[#df4f7d] px-3 text-sm font-semibold text-white"
                            type="submit"
                          >
                            {action.label}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
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
