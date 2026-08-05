import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Gift,
  HandCoins,
  Heart,
  MessageCircle,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { formatRubles } from "@/lib/money";

export const metadata = {
  title: "Аналитика эфира",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Ledger = {
  source_type: string;
  gross_minor: number;
  platform_fee_minor: number;
  creator_net_minor: number;
};

const REACTION_EMOJI: Record<string, string> = {
  fire: "🔥",
  heart: "❤️",
  like: "👍",
  clap: "👏",
};

export default async function LiveRoomAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, user } = await requireUser();
  const { data: room } = await supabase
    .from("live_rooms")
    .select("id, host_id, title, status, created_at")
    .eq("slug", slug)
    .eq("host_id", user.id)
    .maybeSingle();
  if (!room) notFound();

  const [
    { count: viewers },
    { count: messages },
    { data: reactions },
    { data: gifts },
    { data: donations },
  ] = await Promise.all([
    supabase
      .from("live_room_participants")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .is("left_at", null),
    supabase
      .from("live_room_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id),
    supabase.from("live_room_reactions").select("reaction_code").eq("room_id", room.id),
    supabase.from("live_room_gifts").select("id, price_minor").eq("room_id", room.id),
    supabase
      .from("live_room_donations")
      .select("id, amount_minor")
      .eq("room_id", room.id),
  ]);

  const giftTotalMinor = (gifts ?? []).reduce(
    (sum, gift) => sum + Number(gift.price_minor),
    0,
  );
  const donationTotalMinor = (donations ?? []).reduce(
    (sum, donation) => sum + Number(donation.amount_minor),
    0,
  );
  const sourceIds = [
    ...(gifts ?? []).map((gift) => gift.id),
    ...(donations ?? []).map((donation) => donation.id),
  ];
  const { data: rawLedger } = sourceIds.length
    ? await supabase
        .from("creator_ledger_entries")
        .select("source_type, gross_minor, platform_fee_minor")
        .eq("creator_id", user.id)
        .in("source_id", sourceIds)
    : { data: [] };
  const ledger = (rawLedger ?? []) as Ledger[];
  const giftIncome = ledger
    .filter((item) => item.source_type === "gift")
    .reduce((sum, item) => sum + Number(item.creator_net_minor ?? 0), 0);
  const donationIncome = ledger
    .filter((item) => item.source_type === "live_donation")
    .reduce((sum, item) => sum + Number(item.creator_net_minor ?? 0), 0);
  const commission = ledger.reduce(
    (sum, item) => sum + Number(item.platform_fee_minor ?? 0),
    0,
  );

  const reactionCount = (code: string) =>
    reactions?.filter((item) => item.reaction_code === code).length ?? 0;
  const totalReactions = reactions?.length ?? 0;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#0c0e14] px-4 py-5 text-white">
      <header className="flex items-center justify-between">
        <Link
          className="bg-white/8 grid size-9 place-items-center rounded-full"
          href={`/live/${slug}`}
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Аналитика эфира</h1>
        <span className="w-9" />
      </header>
      <section className="mt-7 rounded-2xl border border-white/10 bg-[#171923] p-5">
        <p className="text-sm text-[#b9b1c5]">{room.title}</p>
        <p className="mt-2 text-xs text-[#9991a3]">
          {room.status === "live" ? "🔴 В эфире · " : "Завершён · "}
          создан{" "}
          {new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(room.created_at))}
        </p>
      </section>
      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <UsersRound className="size-5 text-[#9e88ff]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Зрители</p>
          <b className="mt-1 block text-2xl">{viewers ?? 0}</b>
        </div>
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <MessageCircle className="size-5 text-[#7fd8ff]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Сообщения</p>
          <b className="mt-1 block text-2xl">{messages ?? 0}</b>
        </div>
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <Heart className="size-5 text-[#ff79b5]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Реакции</p>
          <b className="mt-1 block text-2xl">{totalReactions}</b>
        </div>
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <Gift className="size-5 text-[#ffd35e]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Подарки</p>
          <b className="mt-1 block text-2xl">{gifts?.length ?? 0}</b>
        </div>
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <HandCoins className="size-5 text-[#6fe3a1]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Донаты</p>
          <b className="mt-1 block text-2xl">{donations?.length ?? 0}</b>
        </div>
        <div className="border-white/8 rounded-2xl border bg-[#171923] p-4">
          <WalletCards className="size-5 text-[#e17dff]" />
          <p className="mt-3 text-xs text-[#aaa2b4]">Доход</p>
          <b className="mt-1 block text-lg">
            {formatRubles(giftIncome + donationIncome)}
          </b>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-bold">Реакции</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {Object.entries(REACTION_EMOJI).map(([code, emoji]) => (
            <div className="rounded-xl bg-white/5 p-3 text-center" key={code}>
              {emoji}
              <b className="mt-1 block">{reactionCount(code)}</b>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-bold">Монетизация</h2>
        <div className="mt-3 space-y-2">
          <div className="border-white/8 flex justify-between rounded-xl border bg-[#171923] p-4">
            <span className="text-[#d6cede]">Сумма подарков</span>
            <b>{formatRubles(giftTotalMinor)}</b>
          </div>
          <div className="border-white/8 flex justify-between rounded-xl border bg-[#171923] p-4">
            <span className="text-[#d6cede]">Сумма донатов</span>
            <b>{formatRubles(donationTotalMinor)}</b>
          </div>
          <div className="border-white/8 flex justify-between rounded-xl border bg-[#171923] p-4">
            <span className="text-[#d6cede]">Доход от подарков</span>
            <b>{formatRubles(giftIncome)}</b>
          </div>
          <div className="border-white/8 flex justify-between rounded-xl border bg-[#171923] p-4">
            <span className="text-[#d6cede]">Доход от донатов</span>
            <b>{formatRubles(donationIncome)}</b>
          </div>
          <div className="border-white/8 flex justify-between rounded-xl border bg-[#171923] p-4">
            <span className="text-[#d6cede]">Комиссия платформы</span>
            <b>{formatRubles(commission)}</b>
          </div>
        </div>
      </section>
      <p className="mt-7 flex items-center gap-2 text-xs leading-5 text-[#9f97aa]">
        <BarChart3 className="size-4" /> Все показатели и доход тестовые. Реальная
        аналитика и выплаты подключаются после production payment stack.
      </p>
    </main>
  );
}
