import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  CircleDollarSign,
  Gift,
  HandCoins,
  Heart,
  LockKeyhole,
  MessageCircle,
  Play,
  Repeat,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Доход автора",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type LedgerEntry = {
  id: string;
  source_type: string;
  gross_minor: number;
  platform_fee_minor: number;
  creator_net_minor: number;
  currency: string;
  status: string;
  created_at: string;
};

const labels: Record<string, { label: string; icon: typeof Gift; color: string }> = {
  story_unlock: {
    label: "Платные stories",
    icon: Play,
    color: "bg-[#f2e5ff] text-[#8b4ce5]",
  },
  message_request: {
    label: "Платные сообщения",
    icon: MessageCircle,
    color: "bg-[#ffe6f0] text-[#dc3f79]",
  },
  support: {
    label: "Поддержка",
    icon: Heart,
    color: "bg-[#fff1cd] text-[#ae7914]",
  },
  subscription: {
    label: "Подписки",
    icon: Repeat,
    color: "bg-[#e8f5ff] text-[#2d82bb]",
  },
  gift: { label: "Подарки", icon: Gift, color: "bg-[#e8f8f1] text-[#19885e]" },
  live_donation: {
    label: "Донаты эфира",
    icon: HandCoins,
    color: "bg-[#ffe8da] text-[#c55a25]",
  },
};

export default async function CreatorEarningsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator, username")
    .eq("id", user.id)
    .maybeSingle();
  const { data: rawEntries } = await supabase
    .from("creator_ledger_entries")
    .select(
      "id, source_type, gross_minor, platform_fee_minor, creator_net_minor, currency, status, created_at",
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const entries = (rawEntries ?? []) as LedgerEntry[];
  const net = entries.reduce((sum, item) => sum + Number(item.creator_net_minor), 0);
  const commission = entries.reduce(
    (sum, item) => sum + Number(item.platform_fee_minor),
    0,
  );
  const byType = new Map<string, number>();
  for (const entry of entries) {
    byType.set(
      entry.source_type,
      (byType.get(entry.source_type) ?? 0) + Number(entry.creator_net_minor),
    );
  }
  const sourceRows = Object.keys(labels).map((type) => ({
    type,
    amount: byType.get(type) ?? 0,
    ...labels[type],
  }));
  const highestSource = Math.max(...sourceRows.map((row) => row.amount), 1);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#241a2c]">
      <header className="flex items-center justify-between">
        <Link
          className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white shadow-[0_6px_18px_rgba(64,38,88,0.08)]"
          href={profile?.username ? `/u/${profile.username}` : "/feed"}
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-black tracking-[-0.03em]">Мой доход</h1>
        <Link
          className="grid size-10 place-items-center rounded-full border border-[#2c2036]/10 bg-white text-[#8b5fbd] shadow-[0_6px_18px_rgba(64,38,88,0.08)]"
          href="/creator/dashboard"
        >
          <WalletCards className="size-5" />
        </Link>
      </header>

      {!profile?.is_creator ? (
        <section className="mt-14 rounded-[2rem] border border-[#2c2036]/10 bg-white p-7 text-center shadow-[0_18px_45px_rgba(69,43,94,0.08)]">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f0e4ff] text-[#8b4ce5]">
            <Sparkles className="size-6" />
          </span>
          <h2 className="mt-5 text-xl font-black">Сначала — страница автора</h2>
          <p className="mt-2 text-sm leading-6 text-[#776c80]">
            Доход и аналитика появятся после активации creator-профиля.
          </p>
          <Link
            className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#ff4c8b] to-[#8753ef] px-5 py-3 text-sm font-black text-white"
            href="/creator/start"
          >
            Создать страницу
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#d9b9ff]/60 bg-white p-5 shadow-[0_18px_48px_rgba(84,49,112,0.11)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#8b5fbd]">
                  Тестовый баланс
                </p>
                <p className="mt-2 text-4xl font-black tracking-[-0.06em]">
                  {formatRubles(net)}
                </p>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#ff77ad] to-[#8859ef] text-white shadow-[0_10px_22px_rgba(174,74,201,0.26)]">
                <TrendingUp className="size-6" />
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f6f0fb] p-3.5">
              <span className="text-xs leading-5 text-[#73677c]">
                Вывод появится после подключения платёжного партнёра и проверки
                возраста.
              </span>
              <button
                className="ml-3 shrink-0 rounded-xl bg-[#ded2ec] px-3 py-2 text-xs font-bold text-[#8a799d]"
                disabled
              >
                Вывести
              </button>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#2c2036]/10 bg-white p-4 shadow-[0_10px_28px_rgba(69,43,94,0.06)]">
              <TrendingUp className="size-5 text-[#9b59e9]" />
              <p className="mt-4 text-xs text-[#7a6e83]">Доход за период</p>
              <b className="mt-1 block text-lg tracking-[-0.035em]">
                {formatRubles(net)}
              </b>
            </div>
            <div className="rounded-2xl border border-[#2c2036]/10 bg-white p-4 shadow-[0_10px_28px_rgba(69,43,94,0.06)]">
              <CircleDollarSign className="size-5 text-[#d8962b]" />
              <p className="mt-4 text-xs text-[#7a6e83]">Комиссия платформы</p>
              <b className="mt-1 block text-lg tracking-[-0.035em]">
                {formatRubles(commission)}
              </b>
            </div>
          </section>

          <section className="mt-6 rounded-[1.75rem] border border-[#2c2036]/10 bg-white p-5 shadow-[0_10px_28px_rgba(69,43,94,0.06)]">
            <div className="flex items-center justify-between">
              <h2 className="font-black tracking-[-0.03em]">Источники дохода</h2>
              <span className="text-xs font-semibold text-[#9b59e9]">За всё время</span>
            </div>
            <div className="mt-4 space-y-4">
              {sourceRows.map((source) => (
                <div key={source.type}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-xl text-sm font-black ${source.color}`}
                      >
                        <source.icon className="size-4" />
                      </span>
                      <span className="truncate text-sm font-semibold">
                        {source.label}
                      </span>
                    </span>
                    <b className="shrink-0 text-sm">{formatRubles(source.amount)}</b>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0eaf5]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff70a6] to-[#8154e9]"
                      style={{
                        width: `${Math.max(0, (source.amount / highestSource) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-black tracking-[-0.03em]">Последние операции</h2>
              <span className="text-xs text-[#7a6e83]">Тестовый режим</span>
            </div>
            {entries.length > 0 ? (
              <div className="mt-3 space-y-2.5">
                {entries.slice(0, 12).map((entry) => {
                  const source = labels[entry.source_type] ?? {
                    label: entry.source_type,
                    icon: Sparkles,
                    color: "bg-[#f0e4ff] text-[#8b4ce5]",
                  };
                  return (
                    <div
                      className="flex items-center justify-between rounded-2xl border border-[#2c2036]/10 bg-white px-4 py-3 shadow-[0_7px_20px_rgba(69,43,94,0.05)]"
                      key={entry.id}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm ${source.color}`}
                        >
                          <source.icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <b className="block truncate text-sm">{source.label}</b>
                          <small className="text-xs text-[#84778d]">
                            Тестовая операция
                          </small>
                        </span>
                      </span>
                      <b className="shrink-0 text-sm text-[#19885e]">
                        +{formatRubles(entry.creator_net_minor)}
                      </b>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-[#2c2036]/20 bg-white/60 p-5 text-sm leading-6 text-[#776c80]">
                Доход появится после первого тестового открытия story, подарка или
                поддержки.
              </div>
            )}
          </section>
        </>
      )}

      <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs leading-5 text-[#887a91]">
        <LockKeyhole className="size-3.5" /> Деньги и ⭐ Хочу-бонусы учитываются
        отдельно.
      </p>
      <Link
        className="mt-4 flex items-center justify-center gap-1 text-sm font-bold text-[#8753e6]"
        href="/creator/dashboard"
      >
        К панели автора <ChevronRight className="size-4" />
      </Link>
    </main>
  );
}
