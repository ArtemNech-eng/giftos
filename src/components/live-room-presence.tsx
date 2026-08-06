"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { joinLiveRoom, leaveLiveRoom } from "@/app/live/actions";
import { createClient } from "@/lib/supabase/client";

/**
 * Live room presence.
 *
 * - Marks the current user as present (viewer) when the room page opens.
 * - Streams `live_room_participants` changes and refreshes the server
 *   render so the viewer count and cohost list stay live for everyone.
 * - Marks the user as left when the page unmounts (viewer role only).
 */
export function LiveRoomPresence({ roomId, slug }: { roomId: string; slug: string }) {
  const router = useRouter();

  const supabaseEnabled =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const supabase = createClient();

    const joinData = new FormData();
    joinData.set("room_id", roomId);
    joinData.set("slug", slug);
    void joinLiveRoom(joinData).catch(() => {
      // Non-blocking: presence is best-effort.
    });

    const channel = supabase
      .channel(`live-room-presence:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_room_participants",
          filter: `room_id=eq.${roomId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      const leaveData = new FormData();
      leaveData.set("room_id", roomId);
      leaveData.set("slug", slug);
      void leaveLiveRoom(leaveData).catch(() => {
        // Non-blocking: presence is best-effort.
      });
    };
  }, [roomId, slug, router, supabaseEnabled]);

  return null;
}
