import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  story_unlock: "Платные stories",
  message_request: "Платные сообщения",
  support: "Поддержка",
  subscription: "Подписки",
  gift: "Подарки",
  live_donation: "Донаты эфира",
};

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

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/**
 * Author earnings export. Returns the full creator ledger as a CSV file
 * (semicolon-separated, UTF-8 with BOM, so Russian Excel opens it cleanly).
 * Test-only data until the production payment stack lands.
 */
export async function GET() {
  const { supabase, user } = await requireUser();
  const { data: rawEntries } = await supabase
    .from("creator_ledger_entries")
    .select(
      "id, source_type, gross_minor, platform_fee_minor, creator_net_minor, currency, status, created_at",
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });
  const entries = (rawEntries ?? []) as LedgerEntry[];

  const header = [
    "ID",
    "Дата (Москва)",
    "Тип",
    "Брутто, руб",
    "Комиссия, руб",
    "Чистыми, руб",
    "Валюта",
    "Статус",
  ];
  const rows = entries.map((entry) => [
    entry.id,
    new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(entry.created_at)),
    TYPE_LABELS[entry.source_type] ?? entry.source_type,
    (Number(entry.gross_minor) / 100).toFixed(2).replace(".", ","),
    (Number(entry.platform_fee_minor) / 100).toFixed(2).replace(".", ","),
    (Number(entry.creator_net_minor) / 100).toFixed(2).replace(".", ","),
    entry.currency,
    entry.status,
  ]);

  const totals = entries.reduce(
    (acc, entry) => ({
      gross: acc.gross + Number(entry.gross_minor),
      fee: acc.fee + Number(entry.platform_fee_minor),
      net: acc.net + Number(entry.creator_net_minor),
    }),
    { gross: 0, fee: 0, net: 0 },
  );
  rows.push([
    "",
    "",
    "ИТОГО",
    (totals.gross / 100).toFixed(2).replace(".", ","),
    (totals.fee / 100).toFixed(2).replace(".", ","),
    (totals.net / 100).toFixed(2).replace(".", ","),
    "",
    "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const date = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll(".", "-");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="creator-earnings-${date}.csv"`,
    },
  });
}
