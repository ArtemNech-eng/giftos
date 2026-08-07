"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * The City Pulse is a server-rendered safe view. This client bridge refreshes
 * it when public city activity changes, so the city does not feel frozen while
 * someone is watching it.
 */
export function CityPulseRefresh({ cityId }: { cityId: string | null | undefined }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!cityId) return;
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )
      return;

    const supabase = createClient();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 650);
    };
    const channel = supabase
      .channel(`city-pulse:${cityId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "place_presence" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "place_messages" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_rooms" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "city_social_moments" },
        refresh,
      )
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [cityId, router]);

  return null;
}
