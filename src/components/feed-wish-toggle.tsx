"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * «Хочу также» toggle for feed wish cards.
 * Calls the feed-friendly server action (no redirect), shows optimistic UI.
 */
export function FeedWishToggle({
  wishId,
  initialCount,
  initialActive,
}: {
  wishId: string;
  initialCount: number;
  initialActive: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    // Optimistic update.
    const nextActive = !active;
    setActive(nextActive);
    setCount((prev) => prev + (nextActive ? 1 : -1));
    try {
      const formData = new FormData();
      formData.set("wish_id", wishId);
      await fetch("/wishes/toggle-feed", {
        method: "POST",
        body: formData,
      });
    } catch {
      // Roll back on failure.
      setActive(!nextActive);
      setCount((prev) => prev + (nextActive ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-bold transition ${
        active
          ? "border-[#ff77ba]/50 bg-[#3a1a35] text-[#ffb7dd]"
          : "border-white/15 bg-white/5 text-[#d8d0e0] hover:border-[#ff77ba]"
      }`}
      onClick={() => void toggle()}
      type="button"
    >
      <Sparkles className="size-3.5" />
      {count > 0 ? count : "Хочу также"}
    </button>
  );
}
