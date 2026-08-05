import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { moderateTarget, resolveReport } from "@/app/admin/reports/actions";
import { EmptyState } from "@/components/empty-state";
import { requireModerator } from "@/lib/auth";

export const metadata = { title: "Модерация", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Report = {
  id: string;
  reporter_id: string;
  target_type: "profile" | "wish" | "fundraiser" | "comment" | "message";
  target_id: string;
  reason: string;
  details: string | null;
  status: "open" | "in_review" | "resolved" | "dismissed";
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

function moderationActionFor(type: Report["target_type"]) {
  if (type === "comment") return { value: "hide_comment", label: "Скрыть сообщение" };
  if (type === "profile")
    return { value: "suspend_profile", label: "Заблокировать профиль" };
  if (type === "fundraiser")
    return { value: "cancel_fundraiser", label: "Скрыть сбор" };
  return null;
}

export default async function AdminReportsPage() {
  const { supabase, role } = await requireModerator();
  const { data: rawReports } = await supabase
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, details, status, created_at",
    )
    .in("status", ["open", "in_review"])
    .order("created_at", { ascending: true })
    .limit(100);
  const reports = (rawReports ?? []) as Report[];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Очередь жалоб</h1>
        </div>
        <ShieldAlert className="mb-2 hidden size-8 text-[#d34872] sm:block" />
      </div>

      <section className="mt-8">
        {reports.length === 0 ? (
          <EmptyState
            actionHref="/"
            actionLabel="К ленте"
            description="Открытых жалоб сейчас нет."
            title="Очередь пуста"
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
              return (
                <article className="surface rounded-2xl p-5" key={report.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-[#bd3e66]">
                        {reasonLabels[report.reason] ?? report.reason}
                      </span>
                      <h2 className="mt-3 font-bold">Жалоба на {report.target_type}</h2>
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
