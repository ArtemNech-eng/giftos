import Link from "next/link";
import { Crown, ShoppingBag } from "lucide-react";

import { buyItem, buyVip, equipItem } from "@/app/shop/actions";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Магазин",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type ItemRow = {
  id: string;
  item_type: string;
  name: string;
  description: string | null;
  emoji: string;
  price_stars: number;
  is_limited: boolean;
  remaining_edition: number | null;
  total_edition: number | null;
};

export default async function ShopPage() {
  const { supabase, user } = await requireUser();
  const [{ data: wallet }, { data: rawItems }, { data: inventory }, { data: vip }] =
    await Promise.all([
      supabase
        .from("bonus_wallets")
        .select("available_balance")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("virtual_items")
        .select(
          "id, item_type, name, description, emoji, price_stars, is_limited, remaining_edition, total_edition",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("user_inventory")
        .select("item_id, is_equipped")
        .eq("profile_id", user.id),
      supabase
        .from("vip_subscriptions")
        .select("expires_at, status")
        .eq("profile_id", user.id)
        .maybeSingle(),
    ]);
  const items = (rawItems ?? []) as ItemRow[];
  const owned = new Map(
    (inventory ?? []).map((row) => [String(row.item_id), Boolean(row.is_equipped)]),
  );
  const balance = wallet?.available_balance ?? 0;
  const vipActive =
    vip !== null &&
    vip?.status === "active" &&
    new Date(vip.expires_at ?? "").getTime() > Date.now();
  const vipExpires =
    vipActive && vip
      ? new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(vip.expires_at))
      : null;

  const typeLabels: Record<string, string> = {
    badge: "Значки",
    avatar_frame: "Рамки",
    effect: "Эффекты",
    profile_theme: "Темы профиля",
  };

  const groups = Object.entries(typeLabels).map(([type, label]) => ({
    type,
    label,
    items: items.filter((item) => item.item_type === type),
  }));

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link className="text-sm text-[#e3a3d5]" href="/feed">
          ← Лента
        </Link>
        <h1 className="text-lg font-bold">Магазин</h1>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-[#ffd35e]">
          <ShoppingBag className="size-4" /> {balance}
        </span>
      </header>

      <section className="mt-5 rounded-2xl border border-[#ffd35e]/30 bg-gradient-to-r from-[#2b193f] to-[#1c1528] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#ffd35e]/15 text-2xl">
            👑
          </span>
          <div className="min-w-0 grow">
            <p className="font-bold">VIP за 149 ⭐ / месяц</p>
            <p className="mt-0.5 text-xs text-[#b8b0c3]">
              Значок VIP, рамка профиля и бонусы
            </p>
            {vipActive ? (
              <p className="mt-1 text-xs font-semibold text-[#8df0b4]">
                Активен до {vipExpires}
              </p>
            ) : null}
          </div>
          {!vipActive && (
            <form action={buyVip}>
              <button
                className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
                type="submit"
              >
                Оформить
              </button>
            </form>
          )}
        </div>
      </section>

      {items.some((item) => item.is_limited) && (
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <h2 className="font-bold">💎 Коллекция</h2>
            <span className="rounded-full bg-[#e17dff]/15 px-2 py-0.5 text-[10px] font-bold text-[#e17dff]">
              ЛИМИТИРОВАННО
            </span>
          </div>
          <p className="mt-1 text-xs text-[#aaa4b7]">
            Редкие предметы ограниченного тиража — когда раскупят, их больше не будет.
          </p>
          <div className="mt-3 space-y-2">
            {items
              .filter((item) => item.is_limited)
              .map((item) => {
                const isOwned = owned.has(item.id);
                const isEquipped = owned.get(item.id) ?? false;
                const remaining = item.remaining_edition ?? 0;
                return (
                  <div
                    className="flex items-center gap-3 rounded-2xl border border-[#e17dff]/25 bg-gradient-to-r from-[#2a1333] to-[#171923] p-3"
                    key={item.id}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e17dff]/25 to-[#7d45ff]/25 text-2xl">
                      {item.emoji}
                    </span>
                    <span className="min-w-0 grow">
                      <span className="block truncate text-sm font-bold">
                        {item.name}
                        <span className="ml-2 text-[10px] font-bold text-[#e17dff]">
                          {remaining} / {item.total_edition}
                        </span>
                      </span>
                      {item.description && (
                        <span className="mt-0.5 block text-xs text-[#aaa4b7]">
                          {item.description}
                        </span>
                      )}
                    </span>
                    {isOwned ? (
                      <form action={equipItem}>
                        <input name="item_id" type="hidden" value={item.id} />
                        <button
                          className={`rounded-xl px-3 py-2 text-xs font-bold ${
                            isEquipped
                              ? "bg-[#8df0b4]/15 text-[#8df0b4]"
                              : "border border-white/15 bg-white/5"
                          }`}
                          type="submit"
                        >
                          {isEquipped ? "Надето" : "Надеть"}
                        </button>
                      </form>
                    ) : (
                      <form action={buyItem}>
                        <input name="item_id" type="hidden" value={item.id} />
                        <button
                          className="rounded-xl bg-gradient-to-r from-[#e17dff] to-[#7d45ff] px-3 py-2 text-xs font-bold disabled:opacity-40"
                          disabled={balance < item.price_stars || remaining <= 0}
                          type="submit"
                        >
                          {remaining <= 0 ? "Раскуплено" : `${item.price_stars} ⭐`}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {groups.map((group) =>
        group.items.length > 0 ? (
          <section className="mt-6" key={group.type}>
            <h2 className="font-bold">{group.label}</h2>
            <div className="mt-3 space-y-2">
              {group.items.map((item) => {
                const isOwned = owned.has(item.id);
                const isEquipped = owned.get(item.id) ?? false;
                return (
                  <div
                    className="border-white/8 flex items-center gap-3 rounded-2xl border bg-[#171923] p-3"
                    key={item.id}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#3b193d] to-[#1f1a38] text-2xl">
                      {item.emoji}
                    </span>
                    <span className="min-w-0 grow">
                      <span className="block truncate text-sm font-bold">
                        {item.name}
                      </span>
                      {item.description && (
                        <span className="mt-0.5 block text-xs text-[#aaa4b7]">
                          {item.description}
                        </span>
                      )}
                    </span>
                    {isOwned ? (
                      <form action={equipItem}>
                        <input name="item_id" type="hidden" value={item.id} />
                        <button
                          className={`rounded-xl px-3 py-2 text-xs font-bold ${
                            isEquipped
                              ? "bg-[#8df0b4]/15 text-[#8df0b4]"
                              : "border border-white/15 bg-white/5"
                          }`}
                          type="submit"
                        >
                          {isEquipped ? "Надето" : "Надеть"}
                        </button>
                      </form>
                    ) : (
                      <form action={buyItem}>
                        <input name="item_id" type="hidden" value={item.id} />
                        <button
                          className="rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-3 py-2 text-xs font-bold disabled:opacity-40"
                          disabled={balance < item.price_stars}
                          type="submit"
                        >
                          {item.price_stars} ⭐
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null,
      )}

      <Link
        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-[#e8a1d5]"
        href="/bonuses"
      >
        <Crown className="size-4" /> Как получить ⭐
      </Link>
    </main>
  );
}
