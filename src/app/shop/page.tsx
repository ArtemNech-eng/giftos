import Link from "next/link";
import { ArrowLeft, Crown, Gem, ShoppingBag, Sparkles, Star } from "lucide-react";

import { buyItem, buyVip, equipItem } from "@/app/shop/actions";
import { VirtualItemIcon } from "@/components/virtual-item-icon";
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
  icon_code: string | null;
  price_stars: number;
  is_limited: boolean;
  remaining_edition: number | null;
  total_edition: number | null;
  requires_vip: boolean;
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
          "id, item_type, name, description, icon_code, price_stars, is_limited, remaining_edition, total_edition, requires_vip",
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
  const { data: spendState } = await supabase.rpc("star_spend_state");
  const spendLimit =
    (spendState as { limit?: number; spent_today?: number } | null) ?? null;
  const spentToday = spendLimit?.spent_today ?? 0;
  const dailyLimit = spendLimit?.limit ?? 0;
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

  const limitedItems = items.filter((item) => item.is_limited);
  const spendPercent =
    dailyLimit > 0 ? Math.min(100, (spentToday / dailyLimit) * 100) : 0;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к бонусам"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/bonuses"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Бонусы и стиль
          </small>
          <h1 className="mt-0.5 text-sm font-black">Магазин ⭐</h1>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#ffd35e]/50 bg-[#fff6d9] px-2.5 py-1.5 text-xs font-black text-[#a57513]">
          <Star className="size-3.5 fill-current" /> {balance}
        </span>
      </header>

      <section className="mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#2a1a4d] via-[#4b2f7a] to-[#7a4fd0] p-5 text-white shadow-[0_15px_32px_rgba(63,37,98,.22)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <ShoppingBag className="size-3.5" /> Твой баланс
        </span>
        <p className="mt-3 text-4xl font-black tracking-[-0.04em]">
          {balance} <span className="text-xl text-white/70">⭐</span>
        </p>
        <p className="mt-2 text-[11px] leading-5 text-white/75">
          ⭐ — внутренние бонусы платформы: за активность, приглашения и участие в жизни
          города. Не деньги и не выводятся.
        </p>
        {dailyLimit > 0 && (
          <div className="mt-4 rounded-2xl bg-black/20 p-3">
            <div className="flex items-center justify-between text-[10px] font-black">
              <span>Лимит трат сегодня</span>
              <span
                className={
                  spentToday >= dailyLimit ? "text-[#ffb3c9]" : "text-white/85"
                }
              >
                {spentToday} / {dailyLimit} ⭐
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff5c99] to-[#ffd35e]"
                style={{ width: `${Math.max(3, spendPercent)}%` }}
              />
            </div>
            {spentToday >= dailyLimit && (
              <p className="mt-1.5 text-[9px] font-bold text-[#ffb3c9]">
                Лимит исчерпан — вернись завтра
              </p>
            )}
          </div>
        )}
      </section>

      <section className="mt-5 rounded-[1.7rem] border border-[#ffd35e]/40 bg-gradient-to-br from-[#fff8e1] to-[#fdf0ff] p-5 shadow-[0_10px_26px_rgba(161,122,55,.1)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffd35e]/25 text-2xl">
              <Crown className="size-6 text-[#b8860b]" />
            </span>
            <div>
              <p className="text-xs font-black">VIP · 149 ⭐ / месяц</p>
              <p className="mt-0.5 text-[10px] leading-4 text-[#756a7d]">
                Значок VIP, рамка профиля и эксклюзивные предметы
              </p>
            </div>
          </div>
          {vipActive ? (
            <span className="rounded-full bg-[#e4f7ed] px-2.5 py-1 text-[10px] font-black text-[#19885e]">
              Активен до {vipExpires}
            </span>
          ) : null}
        </div>
        {!vipActive && (
          <form action={buyVip} className="mt-4">
            <button
              className="w-full rounded-xl bg-gradient-to-r from-[#ffb347] to-[#ff8c42] py-3 text-xs font-black text-[#4a2c05] shadow-[0_8px_18px_rgba(255,150,60,.3)]"
              type="submit"
            >
              Оформить VIP за 149 ⭐
            </button>
          </form>
        )}
      </section>

      {limitedItems.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <Gem className="size-4 text-[#8753e6]" />
            <h2 className="text-sm font-black">Коллекция</h2>
            <span className="rounded-full bg-[#f0e9ff] px-2 py-0.5 text-[9px] font-black text-[#7549d0]">
              ЛИМИТИРОВАННО
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[#81748a]">
            Редкие предметы ограниченного тиража — когда раскупят, их больше не будет.
          </p>
          <div className="mt-3 space-y-2">
            {limitedItems.map((item) => {
              const isOwned = owned.has(item.id);
              const isEquipped = owned.get(item.id) ?? false;
              const remaining = item.remaining_edition ?? 0;
              return (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-[#e5d5ff] bg-gradient-to-r from-[#f7f0ff] to-[#fff6fb] p-3 shadow-[0_6px_18px_rgba(117,73,208,.07)]"
                  key={item.id}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e8d5ff] to-[#ffd9ec] text-[#7549d0]">
                    <VirtualItemIcon
                      className="size-6"
                      code={item.icon_code}
                      itemType={item.item_type}
                    />
                  </span>
                  <span className="min-w-0 grow">
                    <span className="flex items-center gap-2">
                      <b className="truncate text-xs font-black">{item.name}</b>
                      <span className="shrink-0 rounded-full bg-[#f0e9ff] px-1.5 py-0.5 text-[9px] font-black text-[#7549d0]">
                        {remaining} / {item.total_edition}
                      </span>
                    </span>
                    {item.description && (
                      <span className="mt-0.5 block text-[10px] leading-4 text-[#81748a]">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {isOwned ? (
                    <form action={equipItem}>
                      <input name="item_id" type="hidden" value={item.id} />
                      <button
                        className={`rounded-xl px-3 py-2 text-[10px] font-black ${
                          isEquipped
                            ? "bg-[#e4f7ed] text-[#19885e]"
                            : "border border-[#2c2036]/10 bg-[#fbf9fe] text-[#5f5369]"
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
                        className="rounded-xl bg-gradient-to-r from-[#a67ae7] to-[#7a4fd0] px-3 py-2 text-[10px] font-black text-white shadow-[0_6px_14px_rgba(117,73,208,.25)] disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={
                          balance < item.price_stars ||
                          remaining <= 0 ||
                          (!vipActive && item.requires_vip)
                        }
                        title={
                          item.requires_vip && !vipActive ? "Нужен VIP" : undefined
                        }
                        type="submit"
                      >
                        {remaining <= 0 ? (
                          "Раскуплено"
                        ) : item.requires_vip && !vipActive ? (
                          <span className="inline-flex items-center gap-1">
                            <Crown className="size-3" /> VIP
                          </span>
                        ) : (
                          `${item.price_stars} ⭐`
                        )}
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
            <h2 className="text-sm font-black">{group.label}</h2>
            <div className="mt-3 space-y-2">
              {group.items.map((item) => {
                const isOwned = owned.has(item.id);
                const isEquipped = owned.get(item.id) ?? false;
                return (
                  <div
                    className="border-[#2c2036]/9 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
                    key={item.id}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f3ecff] to-[#fff0f6] text-[#8753e6]">
                      <VirtualItemIcon
                        className="size-6"
                        code={item.icon_code}
                        itemType={item.item_type}
                      />
                    </span>
                    <span className="min-w-0 grow">
                      <b className="block truncate text-xs font-black">{item.name}</b>
                      {item.description && (
                        <span className="mt-0.5 block text-[10px] leading-4 text-[#81748a]">
                          {item.description}
                        </span>
                      )}
                    </span>
                    {isOwned ? (
                      <form action={equipItem}>
                        <input name="item_id" type="hidden" value={item.id} />
                        <button
                          className={`rounded-xl px-3 py-2 text-[10px] font-black ${
                            isEquipped
                              ? "bg-[#e4f7ed] text-[#19885e]"
                              : "border border-[#2c2036]/10 bg-[#fbf9fe] text-[#5f5369]"
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
                          className="rounded-xl bg-gradient-to-r from-[#ff5c99] to-[#8c58ff] px-3 py-2 text-[10px] font-black text-white shadow-[0_6px_14px_rgba(205,82,231,.25)] disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={
                            balance < item.price_stars ||
                            (!vipActive && item.requires_vip)
                          }
                          title={
                            item.requires_vip && !vipActive ? "Нужен VIP" : undefined
                          }
                          type="submit"
                        >
                          {item.requires_vip && !vipActive ? (
                            <span className="inline-flex items-center gap-1">
                              <Crown className="size-3" /> VIP
                            </span>
                          ) : (
                            `${item.price_stars} ⭐`
                          )}
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
        className="mt-7 flex items-center justify-center gap-2 text-sm font-black text-[#8753e6]"
        href="/bonuses"
      >
        <Sparkles className="size-4" /> Как получить ⭐
      </Link>
    </main>
  );
}
