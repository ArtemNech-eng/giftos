import Link from "next/link";
import { ClipboardList, ShieldAlert } from "lucide-react";

import { requireModerator } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

export const metadata = {
  title: "Журнал действий модерации",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const actionLabels: Record<string, string> = {
  hide_comment: "Скрыть сообщение сбора",
  hide_wish: "Скрыть желание",
  hide_wish_comment: "Скрыть комментарий желания",
  hide_story: "Скрыть story",
  end_live_room: "Завершить эфир",
  hide_place: "Скрыть место",
  hide_place_message: "Скрыть сообщение места",
  hide_live_message: "Скрыть сообщение эфира",
  suspend_profile: "Заблокировать профиль",
  cancel_fundraiser: "Скрыть сбор",
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

type Action = {
  id: string;
  moderator_id: string;
  target_type: string;
  target_id: string;
  action: string;
  note: string | null;
  created_at: string;
};

export default async function AdminActionsPage() {
  const { supabase, role } = await requireModerator();
  const { data: rawActions } = await supabase
    .from("moderation_actions")
    .select("id, moderator_id, target_type, target_id, action, note, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const actions = (rawActions ?? []) as Action[];

  const moderatorIds = [...new Set(actions.map((action) => action.moderator_id))];
  const { data: moderators } = moderatorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", moderatorIds)
    : { data: [] };
  const moderatorNames = new Map(
    (moderators ?? []).map((moderator) => [
      moderator.id,
      moderator.display_name ?? `@${moderator.username}`,
    ]),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Журнал действий</h1>
        </div>
        <ClipboardList className="mb-2 hidden size-8 text-[#d34872] sm:block" />
      </div>

      <nav className="mt-6 flex gap-1 rounded-xl bg-[#f5e9ed] p-1">
        <Link
          className="flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#8e6a75] hover:text-[#bd3e66]"
          href="/admin/reports"
        >
          Жалобы
        </Link>
        <Link
          className="flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#8e6a75] hover:text-[#bd3e66]"
          href="/admin/stories"
        >
          Видео
        </Link>
        <Link
          className="flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#8e6a75] hover:text-[#bd3e66]"
          href="/admin/economy"
        >
          Экономика
        </Link>
        <Link
          className="flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#8e6a75] hover:text-[#bd3e66]"
          href="/admin/city"
        >
          Город
        </Link>
        <Link
          className="flex flex-1 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#bd3e66] shadow-sm"
          href="/admin/actions"
        >
          <ShieldAlert className="mr-1 size-4" /> Действия
        </Link>
      </nav>

      <section className="mt-8">
        {actions.length === 0 ? (
          <EmptyState
            actionHref="/admin/reports"
            actionLabel="К жалобам"
            description="Действия появятся, когда модераторы начнут решать жалобы."
            title="Журнал пуст"
          />
        ) : (
          <div className="space-y-2">
            {actions.map((action) => (
              <div
                className="surface flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3"
                key={action.id}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {actionLabels[action.action] ?? action.action}
                    <span className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-[#bd3e66]">
                      {targetLabels[action.target_type] ?? action.target_type}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-[#9b858c]">
                    {action.target_id}
                  </p>
                  {action.note && (
                    <p className="mt-1 text-sm text-[#8e747c]">{action.note}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">
                    {moderatorNames.get(action.moderator_id) ?? "Модератор"}
                  </p>
                  <p className="text-xs text-[#9b858c]">
                    {new Intl.DateTimeFormat("ru-RU", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(action.created_at))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        className="mt-4 inline-block text-sm font-semibold text-[#a13d5e]"
        href="/admin/reports"
      >
        ← К модерации
      </Link>
    </main>
  );
}
