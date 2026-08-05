"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/** Refreshes the server-rendered discussion when a new comment is broadcast. */
export function LiveDiscussionRefresh({ fundraiserId }: { fundraiserId: string }) {
  const router = useRouter();

  useEffect(() => {
    // Keeps static demo pages usable until a self-hosted Supabase environment is set.
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`fundraiser-discussion:${fundraiserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fundraiser_comments",
          filter: `fundraiser_id=eq.${fundraiserId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fundraiserId, router]);

  return null;
}
