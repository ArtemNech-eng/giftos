import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  Coins,
  ShieldAlert,
  Users,
  WalletCards,
} from "lucide-react";

import { AdminNav } from "@/components/admin-nav";
import { requireModerator } from "@/lib/auth";

export const metadata = {
  title: "Панель управления",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { supabase, role } = await requireModerator();

  const [
    { count: openReports },
    { count: pendingStories },
    { count: users },
    { count: suspended },
    { count: activeVip },
    { data: recentReports },
    { data: recentActions },
  ] = await Promise.all([
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_review"]),
    supabase
      .from("stories")
      .select("*", { count: "exact", head: true })
      .eq("moderation_status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_suspended", true),
    supabase
      .from("vip_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("reports")
      .select("id, target_type, reason, status, created_at")
      .in("status", ["open", "in_review"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("moderation_actions")
      .select("id, action, target_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const kpis: Array<{
    label: string;
    value: number;
    href: Route;
    icon: typeof ShieldAlert;
    tint: string;
    sub?: string;
  }> = [
    {
      label: "Открытые жалобы",
      value: openReports ?? 0,
      href: "/admin/reports",
      icon: ShieldAlert,
      tint: "bg-rose-50 text-[#df4f7d]",
    },
    {
      label: "Видео на проверке",
      value: pendingStories ?? 0,
      href: "/admin/stories",
      icon: Activity,
      tint: "bg-violet-50 text-[#8b5cf6]",
    },
    {
      label: "Пользователи",
      value: users ?? 0,
      href: "/admin/users",
      icon: Users,
      tint: "bg-sky-50 text-[#2d82bb]",
      sub: `${suspended ?? 0} в бане`,
    },
    {
      label: "Активный VIP",
      value: activeVip ?? 0,
      href: "/admin/economy",
      icon: WalletCards,
      tint: "bg-amber-50 text-[#b8860b]",
    },
  ];

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Обзор</h1>
          <p className="mt-1 text-sm text-[#8e6a75]">
            Текущее состояние платформы и очереди на модерацию
          </p>
        </div>
      </div>

      <AdminNav active="/admin" />

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            className="surface rounded-2xl p-4 transition hover:-translate-y-0.5"
            href={kpi.href}
            key={kpi.label}
          >
            <span className={`grid size-10 place-items-center rounded-xl ${kpi.tint}`}>
              <kpi.icon className="size-5" />
            </span>
            <p className="mt-3 text-xs text-[#8e747c]">{kpi.label}</p>
            <b className="mt-1 block text-2xl">{kpi.value}</b>
            {kpi.sub && <p className="mt-0.5 text-[10px] text-[#9b858c]">{kpi.sub}</p>}
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <ShieldAlert className="size-5 text-[#df4f7d]" /> Последние жалобы
            </h2>
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#a13d5e]"
              href="/admin/reports"
            >
              Все <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {(recentReports ?? []).length > 0 ? (
            <div className="mt-4 space-y-2">
              {(recentReports ?? []).map((report) => (
                <div
                  className="surface flex items-center justify-between rounded-2xl px-4 py-3"
                  key={report.id}
                >
                  <div>
                    <b className="block text-sm">{report.target_type}</b>
                    <small className="text-xs text-[#9b858c]">{report.reason}</small>
                  </div>
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-[#bd3e66]">
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-[#e7d8dc] p-5 text-sm text-[#9b858c]">
              Очередь жалоб пуста.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <ClipboardList className="size-5 text-[#8b5cf6]" /> Последние действия
            </h2>
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#a13d5e]"
              href="/admin/actions"
            >
              Журнал <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {(recentActions ?? []).length > 0 ? (
            <div className="mt-4 space-y-2">
              {(recentActions ?? []).map((action) => (
                <div
                  className="surface flex items-center justify-between rounded-2xl px-4 py-3"
                  key={action.id}
                >
                  <b className="text-sm">{action.action}</b>
                  <small className="text-xs text-[#9b858c]">
                    {new Intl.DateTimeFormat("ru-RU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(action.created_at))}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-[#e7d8dc] p-5 text-sm text-[#9b858c]">
              Журнал действий пуст.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link
          className="surface flex items-center gap-3 rounded-2xl p-4 transition hover:-translate-y-0.5"
          href="/admin/economy"
        >
          <Coins className="size-6 text-[#b8860b]" />
          <span>
            <b className="block">Экономика ⭐</b>
            <small className="text-xs text-[#9b858c]">
              Балансы, траты, VIP, лимиты
            </small>
          </span>
        </Link>
        <Link
          className="surface flex items-center gap-3 rounded-2xl p-4 transition hover:-translate-y-0.5"
          href="/admin/users"
        >
          <Users className="size-6 text-[#2d82bb]" />
          <span>
            <b className="block">Пользователи</b>
            <small className="text-xs text-[#9b858c]">
              Поиск, баны, роли модераторов
            </small>
          </span>
        </Link>
        <Link
          className="surface flex items-center gap-3 rounded-2xl p-4 transition hover:-translate-y-0.5"
          href="/admin/settings"
        >
          <Coins className="size-6 text-[#8b5cf6]" />
          <span>
            <b className="block">Настройки платформы</b>
            <small className="text-xs text-[#9b858c]">Бонусы, лимиты, промо-цены</small>
          </span>
        </Link>
      </section>
    </>
  );
}
