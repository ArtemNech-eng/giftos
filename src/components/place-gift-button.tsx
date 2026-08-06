"use client";

import { useState } from "react";
import { Gift } from "lucide-react";

import { sendPlaceGift } from "@/app/places/actions";

/**
 * Gift button for a person in a place: opens a small picker with the
 * virtual gift catalog and submits via the server action.
 */
export function PlaceGiftButton({
  placeId,
  recipientId,
  gifts,
}: {
  placeId: string;
  recipientId: string;
  gifts: Array<{ code: string; label: string; emoji: string; price_minor: number }>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(giftCode: string) {
    if (busy) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("place_id", placeId);
      formData.set("recipient_id", recipientId);
      formData.set("gift_code", giftCode);
      await sendPlaceGift(formData);
    } catch {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-1 rounded-full border border-[#ffd35e]/40 bg-[#2a2215] px-2.5 py-1 text-xs font-semibold text-[#ffd35e] transition hover:border-[#ffd35e]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Gift className="size-3.5" /> Подарок
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-white/10 bg-[#1b1528] p-3 shadow-glow">
          <p className="text-xs font-bold text-[#e7c9f5]">Выберите подарок</p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {gifts.map((gift) => (
              <button
                className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-1 py-1.5 transition hover:border-[#ff77ba] disabled:opacity-50"
                disabled={busy}
                key={gift.code}
                onClick={() => void submit(gift.code)}
                type="button"
              >
                <span className="text-xl">{gift.emoji}</span>
                <span className="mt-0.5 text-[9px] text-[#ffb7dd]">
                  {gift.price_minor / 100} ₽
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
