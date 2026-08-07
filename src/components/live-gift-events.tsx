"use client";

import { useEffect, useRef, useState } from "react";

import { BrandGiftIcon } from "@/components/brand-gift-icon";
import { createClient } from "@/lib/supabase/client";

export type LiveGiftCatalogItem = {
  code: string;
  label: string;
  emoji: string;
  price_minor: number;
};

type GiftEvent = {
  key: string;
  senderName: string;
  code: string;
  label: string;
  priceMinor: number;
  currency: string;
};

/**
 * Story-like gift events over the live room media area.
 *
 * Streams `live_room_gifts` INSERTs and renders animated banners:
 * «Имя подарил Алмаз — 500 ₽». Every participant sees the event in
 * real time, including the sender — no page reload is needed.
 */
export function LiveGiftEvents({
  roomId,
  currentUserId,
  gifts,
}: {
  roomId: string;
  currentUserId: string;
  gifts: LiveGiftCatalogItem[];
}) {
  const [events, setEvents] = useState<GiftEvent[]>([]);
  const catalog = useRef(new Map(gifts.map((gift) => [gift.code, gift])));
  const senderNames = useRef<Record<string, string>>({});
  const seenIds = useRef(new Set<string>());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const supabaseEnabled =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const supabase = createClient();
    const activeTimers = timers.current;

    async function resolveSender(senderId: string) {
      if (senderId === currentUserId || senderNames.current[senderId])
        return senderNames.current[senderId] ?? null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", senderId)
        .maybeSingle();
      const name = data?.display_name ?? "Зритель";
      senderNames.current = { ...senderNames.current, [senderId]: name };
      return name;
    }

    const channel = supabase
      .channel(`live-room-gifts:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_room_gifts",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const record = payload.new as {
            id: string;
            sender_id: string;
            gift_code: string;
            price_minor: number;
            currency: string;
          };
          if (!record?.id || seenIds.current.has(record.id)) return;
          seenIds.current.add(record.id);
          const gift = catalog.current.get(record.gift_code);
          void resolveSender(record.sender_id).then((senderName) => {
            const event: GiftEvent = {
              key: record.id,
              senderName: senderName ?? "Зритель",
              code: record.gift_code,
              label: gift?.label ?? record.gift_code,
              priceMinor: Number(record.price_minor) || 0,
              currency: record.currency ?? "RUB",
            };
            setEvents((prev) => [...prev.slice(-2), event]);
            const timer = setTimeout(() => {
              setEvents((prev) => prev.filter((item) => item.key !== event.key));
              timers.current.delete(timer);
            }, 4500);
            timers.current.add(timer);
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
    };
  }, [roomId, currentUserId, supabaseEnabled]);

  if (!supabaseEnabled || events.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex flex-col items-start gap-2">
      {events.map((event) => (
        <div
          className="live-gift-event flex items-center gap-2 rounded-2xl border border-white/10 bg-black/70 px-3 py-2 shadow-glow backdrop-blur"
          key={event.key}
        >
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff4b8a]/30 to-[#7d45ff]/30 text-[#ffc0da]">
            <BrandGiftIcon className="size-6" code={event.code} />
          </span>
          <span className="text-xs leading-tight">
            <b className="block text-[13px]">{event.senderName}</b>
            <span className="text-[#ffb7dd]">
              {event.label} · {event.priceMinor / 100} ₽
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
