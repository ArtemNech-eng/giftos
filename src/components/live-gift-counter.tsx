"use client";

import { useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/**
 * Live gift counter in the room header. Increments in real time when a
 * viewer sends a gift; initial value comes from the server render.
 */
export function LiveGiftCounter({
  roomId,
  initialCount,
}: {
  roomId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const seenIds = useRef(new Set<string>());

  const supabaseEnabled =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`live-room-gift-counter:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_room_gifts",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const id = (payload.new as { id?: string })?.id;
          if (!id || seenIds.current.has(id)) return;
          seenIds.current.add(id);
          setCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, supabaseEnabled]);

  return (
    <span
      className="bg-white/8 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#ffd35e]"
      title="Подарков в эфире"
    >
      <Gift className="size-4" />
      {count}
    </span>
  );
}
