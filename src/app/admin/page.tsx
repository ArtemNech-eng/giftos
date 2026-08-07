import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardList,
  Coins,
  MessageCircle,
  Radio,
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
    { count: reportedStories },
    { count: users },
    { count: suspended },
    { count: activeVip },
    { data: recentReports },
    { data: recentActions },
    { data: rawProfiles },
    { data: rawDaily },
  ] = await Promise.all([
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_review"]),
    supabase
      .from("reports")
      .select("target_id", { count: "exact", head: true })
      .eq("target_type", "story")
      .in("status", ["open", "in_review"]),
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
    supabase
      .from("profiles")
      .select("id, city_id, created_at, is_suspended")
      .limit(10000),
    supabase.from("admin_city_activity_daily").select("*").limit(30),
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
      label: "Видео с жалобами",
      value: reportedStories ?? 0,
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

  // City analytics: registrations over the last 7 days and top cities.
  const profiles = (rawProfiles ?? []) as Array<{
    city_id: string | null;
    created_at: string;
  }>;
  const dayKey = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(
      new Date(iso),
    );
  const registrationsByDay = new Map<string, number>();
  for (const profile of profiles) {
    const key = dayKey(profile.created_at);
    registrationsByDay.set(key, (registrationsByDay.get(key) ?? 0) + 1);
  }
  const registrationBars: { key: string; label: string; count: number }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(Date.now() - offset * 86_400_000);
    const key = dayKey(date.toISOString());
    registrationBars.push({
      key,
      label: new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        day: "numeric",
        month: "short",
      }).format(date),
      count: registrationsByDay.get(key) ?? 0,
    });
  }
  const maxRegistrations = Math.max(1, ...registrationBars.map((bar) => bar.count));

  const cityCounts = new Map<string, number>();
  const cityIds = new Set<string>();
  for (const profile of profiles) {
    if (!profile.city_id) continue;
    cityIds.add(profile.city_id);
    cityCounts.set(profile.city_id, (cityCounts.get(profile.city_id) ?? 0) + 1);
  }
  const cityNames = new Map<string, string>();
  if (cityIds.size > 0) {
    const { data: cityRows } = await supabase
      .from("cities")
      .select("id, name")
      .in("id", [...cityIds]);
    for (const row of cityRows ?? []) cityNames.set(row.id, row.name);
  }
  const topCities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ name: cityNames.get(id) ?? "Город", count }));
  const maxCityCount = Math.max(1, ...topCities.map((city) => city.count));

  const daily = (rawDaily ?? []) as Array<{
    day: string;
    dau: number;
    messages: number;
    streams_started: number;
    events_created: number;
  }>;
  const last7 = daily.slice(0, 7).reverse();
  const totals7 = last7.reduce(
    (acc, row) => ({
      dau: Math.max(acc.dau, Number(row.dau) || 0),
      messages: acc.messages + (Number(row.messages) || 0),
      streams: acc.streams + (Number(row.streams_started) || 0),
      events: acc.events + (Number(row.events_created) || 0),
    }),
    { dau: 0, messages: 0, streams: 0, events: 0 },
  );

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Обзор</h1>
          <p className="mt-1 text-sm text-[#8e6a75]">
            Текущее состояние платформы и очереди на модерацию
          </p>
        </div>
      </div>

      <AdminNav active="/admin" />

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

      <section className="mt-8 grid gap-6 md:grid-cols-2">
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

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-[#8b5cf6]" />
          <h2 className="text-lg font-bold">Аналитика</h2>
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="surface rounded-2xl p-5">
            <h3 className="text-sm font-bold">Регистрации · 7 дней</h3>
            <p className="mt-1 text-xs text-[#9b858c]">
              Всего за неделю:{" "}
              <b className="text-[#bd3e66]">
                {registrationBars.reduce((sum, bar) => sum + bar.count, 0)}
              </b>
            </p>
            <div className="mt-4 flex h-24 items-end gap-1.5">
              {registrationBars.map((bar) => (
                <div
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  key={bar.key}
                >
                  <span className="text-[9px] font-bold text-[#8e6a75]">
                    {bar.count > 0 ? bar.count : ""}
                  </span>
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-[#df4f7d] to-[#8b5cf6]"
                    style={{
                      height: `${Math.max(4, (bar.count / maxRegistrations) * 100)}%`,
                      opacity: bar.count > 0 ? 1 : 0.12,
                    }}
                  />
                  <span className="text-[8px] text-[#9b858c]">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <Building2 className="size-4 text-[#8b5cf6]" /> Топ городов
            </h3>
            {topCities.length > 0 ? (
              <div className="mt-4 space-y-2.5">
                {topCities.map((city, index) => (
                  <div key={city.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#4a3a42]">
                        {index + 1}. {city.name}
                      </span>
                      <b className="text-[#bd3e66]">{city.count}</b>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f0e2e6]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#df4f7d] to-[#8b5cf6]"
                        style={{ width: `${(city.count / maxCityCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#9b858c]">
                Городов пока нет — первые появятся после онбординга.
              </p>
            )}
          </div>

          <div className="surface rounded-2xl p-5">
            <h3 className="text-sm font-bold">Активность · 7 дней</h3>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-[#fbf5f7] p-3">
                <Users className="size-4 text-[#8b5cf6]" />
                <b className="mt-1.5 block text-lg">
                  {totals7.dau.toLocaleString("ru-RU")}
                </b>
                <small className="text-[10px] text-[#9b858c]">Макс. DAU</small>
              </div>
              <div className="rounded-xl bg-[#fbf5f7] p-3">
                <MessageCircle className="size-4 text-[#2d82bb]" />
                <b className="mt-1.5 block text-lg">
                  {totals7.messages.toLocaleString("ru-RU")}
                </b>
                <small className="text-[10px] text-[#9b858c]">Сообщений</small>
              </div>
              <div className="rounded-xl bg-[#fbf5f7] p-3">
                <Radio className="size-4 text-[#df4f7d]" />
                <b className="mt-1.5 block text-lg">{totals7.streams}</b>
                <small className="text-[10px] text-[#9b858c]">Эфиров</small>
              </div>
              <div className="rounded-xl bg-[#fbf5f7] p-3">
                <Activity className="size-4 text-[#b8860b]" />
                <b className="mt-1.5 block text-lg">{totals7.events}</b>
                <small className="text-[10px] text-[#9b858c]">Событий</small>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
