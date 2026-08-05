import Link from "next/link";
import { ArrowLeft, BarChart3, CircleDollarSign, WalletCards } from "lucide-react";

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
  for (const entry of entries)
    byType.set(
      entry.source_type,
      (byType.get(entry.source_type) ?? 0) + Number(entry.creator_net_minor),
    );
  const labels: Record<string, string> = {
    story_unlock: "Платные stories",
    message_request: "Платные сообщения",
    support: "Поддержка",
    subscription: "Подписки",
    gift: "Подарки",
  };

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href={profile?.username ? `/u/${profile.username}` : "/feed"}
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Мой доход</h1>
        <span className="w-9" />
      </header>
      {!profile?.is_creator ? (
        <div className="mt-12 rounded-2xl border border-white/10 bg-[#171923] p-6 text-center">
          <p className="font-bold">Сначала создайте страницу автора</p>
          <Link
            className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] px-4 py-2 text-sm font-bold"
            href="/creator/start"
          >
            Хочу также
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-[#271839] to-[#171a2b] p-6">
            <p className="text-sm text-[#c6bfd0]">Тестовый баланс</p>
            <p className="mt-2 text-4xl font-bold">{formatRubles(net)}</p>
            <p className="mt-3 text-xs leading-5 text-[#b8b0c3]">
              Это тестовая статистика. Настоящий вывод средств появится после KYC и
              подключения платёжного партнёра.
            </p>
            <button
              className="mt-5 h-10 rounded-xl bg-white/10 px-4 text-sm font-semibold text-[#c7bfd0]"
              disabled
            >
              Вывести позже
            </button>
          </section>
          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
              <BarChart3 className="size-5 text-[#e17dff]" />
              <p className="mt-3 text-xs text-[#a9a2b3]">Доход за период</p>
              <b className="mt-1 block">{formatRubles(net)}</b>
            </div>
            <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
              <CircleDollarSign className="size-5 text-[#ffd35e]" />
              <p className="mt-3 text-xs text-[#a9a2b3]">Комиссия платформы</p>
              <b className="mt-1 block">{formatRubles(commission)}</b>
            </div>
          </section>
          <section className="mt-6">
            <h2 className="font-bold">Источники дохода</h2>
            <div className="mt-3 space-y-2">
              {[
                "story_unlock",
                "message_request",
                "support",
                "subscription",
                "gift",
              ].map((type) => (
                <div
                  className="border-white/8 flex items-center justify-between rounded-xl border bg-[#171923] px-4 py-3"
                  key={type}
                >
                  <span className="text-sm text-[#d9d1e2]">{labels[type]}</span>
                  <b className="text-sm">{formatRubles(byType.get(type) ?? 0)}</b>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-6">
            <h2 className="font-bold">История</h2>
            {entries.length > 0 ? (
              <div className="mt-3 space-y-2">
                {entries.map((entry) => (
                  <div
                    className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                    key={entry.id}
                  >
                    <span>
                      <b className="block text-sm">
                        {labels[entry.source_type] ?? entry.source_type}
                      </b>
                      <small className="text-xs text-[#9f97aa]">
                        Тестовая операция
                      </small>
                    </span>
                    <b className="text-sm text-[#ffd0eb]">
                      +{formatRubles(entry.creator_net_minor)}
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-[#aaa2b4]">
                Доход появится здесь после первого платного открытия story.
              </div>
            )}
          </section>
        </>
      )}
      <Link
        className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-[#de9aff]"
        href="/creator/start"
      >
        <WalletCards className="size-4" /> Улучшить страницу автора
      </Link>
    </main>
  );
}
