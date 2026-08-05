"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/** Refreshes the server-rendered wish discussion when a new comment is broadcast. */
export function LiveWishDiscussionRefresh({ wishId }: { wishId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`wish-discussion:${wishId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wish_comments",
          filter: `wish_id=eq.${wishId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [wishId, router]);

  return null;
}
