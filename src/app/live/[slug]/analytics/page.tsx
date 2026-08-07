import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Flame,
  Gift,
  Hand,
  HandCoins,
  Heart,
  MessageCircle,
  Radio,
  ThumbsUp,
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

const REACTIONS: { code: string; label: string; icon: typeof Flame }[] = [
  { code: "fire", label: "Огонь", icon: Flame },
  { code: "heart", label: "Сердце", icon: Heart },
  { code: "like", label: "Нравится", icon: ThumbsUp },
  { code: "clap", label: "Аплодисменты", icon: Hand },
];

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
        .select("source_type, gross_minor, platform_fee_minor, creator_net_minor")
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
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-10 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Вернуться к эфиру"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href={`/live/${slug}`}
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Сводка эфира
          </small>
          <h1 className="mt-0.5 text-sm font-black">Аналитика эфира</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <BarChart3 className="size-4.5" />
        </span>
      </header>

      <section className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-4 shadow-[0_8px_22px_rgba(69,43,94,.05)]">
        <p className="text-xs font-black leading-5">{room.title}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#81748a]">
          {room.status === "live" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0f6] px-2 py-0.5 text-[9px] font-black text-[#d84b81]">
              <Radio className="size-3" /> В эфире
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1f5] px-2 py-0.5 text-[9px] font-black text-[#5f5369]">
              Завершён
            </span>
          )}
          <span>
            создан{" "}
            {new Intl.DateTimeFormat("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(room.created_at))}
          </span>
        </p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <UsersRound className="size-5 text-[#8753e6]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Зрители</p>
          <b className="mt-1 block text-2xl font-black">{viewers ?? 0}</b>
        </div>
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <MessageCircle className="size-5 text-[#2f9bb5]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Сообщения</p>
          <b className="mt-1 block text-2xl font-black">{messages ?? 0}</b>
        </div>
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <Heart className="size-5 text-[#d84b81]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Реакции</p>
          <b className="mt-1 block text-2xl font-black">{totalReactions}</b>
        </div>
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <Gift className="size-5 text-[#b8860b]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Подарки</p>
          <b className="mt-1 block text-2xl font-black">{gifts?.length ?? 0}</b>
        </div>
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <HandCoins className="size-5 text-[#258b82]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Донаты</p>
          <b className="mt-1 block text-2xl font-black">{donations?.length ?? 0}</b>
        </div>
        <div className="border-[#2c2036]/9 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(69,43,94,.05)]">
          <WalletCards className="size-5 text-[#7549d0]" />
          <p className="mt-3 text-[10px] text-[#81748a]">Доход</p>
          <b className="mt-1 block text-lg font-black">
            {formatRubles(giftIncome + donationIncome)}
          </b>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-black">Реакции</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {REACTIONS.map((reaction) => (
            <div
              className="border-[#2c2036]/9 rounded-2xl border bg-white p-3 text-center shadow-[0_6px_18px_rgba(69,43,94,.05)]"
              key={reaction.code}
            >
              <reaction.icon className="mx-auto size-5 text-[#8753e6]" />
              <b className="mt-1.5 block text-sm font-black">
                {reactionCount(reaction.code)}
              </b>
              <span className="mt-0.5 block text-[9px] text-[#81748a]">
                {reaction.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-black">Монетизация</h2>
        <div className="mt-3 space-y-2">
          {[
            { label: "Сумма подарков", value: formatRubles(giftTotalMinor) },
            { label: "Сумма донатов", value: formatRubles(donationTotalMinor) },
            { label: "Доход от подарков", value: formatRubles(giftIncome) },
            { label: "Доход от донатов", value: formatRubles(donationIncome) },
            { label: "Комиссия платформы", value: formatRubles(commission) },
          ].map((row) => (
            <div
              className="border-[#2c2036]/9 flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-[0_6px_18px_rgba(69,43,94,.05)]"
              key={row.label}
            >
              <span className="text-[10px] text-[#5f5369]">{row.label}</span>
              <b className="text-xs font-black text-[#7549d0]">{row.value}</b>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-7 flex items-center gap-2 text-[10px] leading-5 text-[#8a7d91]">
        <BarChart3 className="size-4 shrink-0" /> Все показатели и доход тестовые.
        Реальная аналитика и выплаты подключаются после production payment stack.
      </p>
    </main>
  );
}
