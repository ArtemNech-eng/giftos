"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type DonationEvent = {
  key: string;
  senderName: string;
  message: string;
  amountMinor: number;
  currency: string;
};

/**
 * Donation messages rendered as story-like banners over the live media area.
 *
 * Streams `live_room_donations` INSERTs. Every participant sees the toaster
 * («Имя: сообщение · 500 ₽») in real time, including the sender.
 */
export function LiveDonationEvents({
  roomId,
  currentUserId,
}: {
  roomId: string;
  currentUserId: string;
}) {
  const [events, setEvents] = useState<DonationEvent[]>([]);
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
      .channel(`live-room-donations:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_room_donations",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const record = payload.new as {
            id: string;
            sender_id: string;
            message: string;
            amount_minor: number;
            currency: string;
          };
          if (!record?.id || seenIds.current.has(record.id)) return;
          seenIds.current.add(record.id);
          void resolveSender(record.sender_id).then((senderName) => {
            const event: DonationEvent = {
              key: record.id,
              senderName: senderName ?? "Зритель",
              message: record.message,
              amountMinor: Number(record.amount_minor) || 0,
              currency: record.currency ?? "RUB",
            };
            setEvents((prev) => [...prev.slice(-1), event]);
            const timer = setTimeout(() => {
              setEvents((prev) => prev.filter((item) => item.key !== event.key));
              activeTimers.delete(timer);
            }, 6000);
            activeTimers.add(timer);
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
    <div className="pointer-events-none absolute inset-x-3 bottom-20 z-30 flex flex-col items-start gap-2">
      {events.map((event) => (
        <div
          className="live-donation-event w-full max-w-xs rounded-2xl border border-[#ff77ba]/50 bg-gradient-to-r from-[#2a1222]/95 to-[#1b1533]/95 p-3 shadow-glow backdrop-blur"
          key={event.key}
        >
          <p className="text-sm font-bold text-[#ffd7ee]">
            {event.senderName}{" "}
            <span className="ml-1 text-[#ffb7dd]">· {event.amountMinor / 100} ₽</span>
          </p>
          {event.message && (
            <p className="mt-1 text-[13px] leading-snug text-[#e9e0f2]">
              {event.message}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
