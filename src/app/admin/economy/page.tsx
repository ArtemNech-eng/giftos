import Link from "next/link";
import { Coins, Crown, Gift, ShoppingBag, TrendingUp } from "lucide-react";

import { requireModerator } from "@/lib/auth";

export const metadata = {
  title: "Экономика",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type DailyRow = {
  day: string;
  earned_count: number;
  earned_stars: number;
  spent_count: number;
  spent_stars: number;
  spent_items: number;
  spent_vip: number;
  spent_gifts: number;
  spent_promotions: number;
  spent_place_style: number;
};

export default async function AdminEconomyPage() {
  const { supabase, role } = await requireModerator();
  const [{ data: totals }, { data: rawDaily }] = await Promise.all([
    supabase.from("admin_star_economy_totals").select("*").maybeSingle(),
    supabase.from("admin_star_economy_daily").select("*").limit(30),
  ]);
  const daily = (rawDaily ?? []) as DailyRow[];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#bd3e66]">
            {role === "admin" ? "Администратор" : "Модератор"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Экономика</h1>
        </div>
        <Coins className="mb-2 hidden size-8 text-[#d34872] sm:block" />
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
          className="flex flex-1 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#bd3e66] shadow-sm"
          href="/admin/economy"
        >
          <Coins className="mr-1 size-4" /> Экономика
        </Link>
      </nav>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="surface rounded-2xl p-4">
          <Coins className="size-5 text-[#d34872]" />
          <p className="mt-3 text-xs text-[#8e747c]">Баланс ⭐ в системе</p>
          <b className="mt-1 block text-2xl">
            {Number(totals?.total_balance ?? 0).toLocaleString("ru-RU")}
          </b>
          <small className="text-xs text-[#9b858c]">
            {totals?.active_wallets ?? 0} кошельков
          </small>
        </div>
        <div className="surface rounded-2xl p-4">
          <TrendingUp className="size-5 text-[#d34872]" />
          <p className="mt-3 text-xs text-[#8e747c]">Выдано ⭐ всего</p>
          <b className="mt-1 block text-2xl">
            {Number(totals?.total_earned ?? 0).toLocaleString("ru-RU")}
          </b>
          <small className="text-xs text-[#9b858c]">
            потрачено: {Number(totals?.total_spent ?? 0).toLocaleString("ru-RU")}
          </small>
        </div>
        <div className="surface rounded-2xl p-4">
          <Crown className="size-5 text-[#d34872]" />
          <p className="mt-3 text-xs text-[#8e747c]">Активных VIP</p>
          <b className="mt-1 block text-2xl">{totals?.active_vip ?? 0}</b>
          <small className="text-xs text-[#9b858c]">
            подарков: {totals?.gifts_sent ?? 0} · предметов: {totals?.items_owned ?? 0}
          </small>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Траты ⭐ по моделям (всего)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              icon: ShoppingBag,
              label: "Магазин (предметы)",
              value: daily.reduce((s, r) => s + Number(r.spent_items), 0),
            },
            {
              icon: Crown,
              label: "VIP",
              value: daily.reduce((s, r) => s + Number(r.spent_vip), 0),
            },
            {
              icon: Gift,
              label: "Подарки",
              value: daily.reduce((s, r) => s + Number(r.spent_gifts), 0),
            },
            {
              icon: TrendingUp,
              label: "Продвижение",
              value: daily.reduce((s, r) => s + Number(r.spent_promotions), 0),
            },
            {
              icon: Coins,
              label: "Оформление мест",
              value: daily.reduce((s, r) => s + Number(r.spent_place_style), 0),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div className="surface rounded-2xl p-4" key={label}>
              <Icon className="size-5 text-[#d34872]" />
              <p className="mt-3 text-xs text-[#8e747c]">{label}</p>
              <b className="mt-1 block text-xl">
                {Number(value).toLocaleString("ru-RU")}
              </b>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Динамика по дням</h2>
        {daily.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-[#e7d8dc] p-5 text-sm text-[#9b858c]">
            Данных пока нет — экономика начнёт накапливаться с первыми активными
            пользователями.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {daily.map((row) => (
              <div
                className="surface flex items-center justify-between rounded-2xl px-4 py-3"
                key={row.day}
              >
                <span className="text-sm font-semibold">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "short",
                  }).format(new Date(row.day))}
                </span>
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-emerald-700">
                    +{Number(row.earned_stars).toLocaleString("ru-RU")}
                  </span>
                  <span className="text-[#c53d68]">
                    −{Number(row.spent_stars).toLocaleString("ru-RU")}
                  </span>
                  <small className="text-[#9b858c]">
                    предметы {row.spent_items} · VIP {row.spent_vip} · подарки{" "}
                    {row.spent_gifts} · продвижение {row.spent_promotions} · места{" "}
                    {row.spent_place_style}
                  </small>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        className="mt-8 inline-block text-sm font-semibold text-[#a13d5e]"
        href="/admin/reports"
      >
        ← К модерации
      </Link>
    </main>
  );
}
