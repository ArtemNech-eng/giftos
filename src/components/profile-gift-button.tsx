"use client";

import { useState } from "react";
import { Gift } from "lucide-react";

import { sendProfileGift } from "@/app/shop/actions";
import { BrandGiftIcon } from "@/components/brand-gift-icon";

/**
 * Telegram-style gift button on a profile: pick a gift, buy it for ⭐
 * and send it to the profile owner.
 */
export function ProfileGiftButton({
  recipientId,
  username,
  gifts,
  isVip,
}: {
  recipientId: string;
  username: string;
  gifts: Array<{
    code: string;
    label: string;
    emoji: string;
    price_stars: number;
    requires_vip: boolean;
  }>;
  isVip: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(giftCode: string) {
    if (busy) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("recipient_id", recipientId);
      formData.set("username", username);
      formData.set("gift_code", giftCode);
      await sendProfileGift(formData);
    } catch {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ffd35e]/40 bg-[#2a2215] px-4 text-sm font-semibold text-[#ffd35e] transition hover:border-[#ffd35e]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Gift className="size-4" /> Подарок
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-white/10 bg-[#1b1528] p-3 shadow-glow">
          <p className="text-xs font-bold text-[#e7c9f5]">Купить и подарить за ⭐</p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {gifts.map((gift) => (
              <button
                className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-1 py-1.5 transition hover:border-[#ff77ba] disabled:opacity-50"
                disabled={busy || (gift.requires_vip && !isVip)}
                key={gift.code}
                onClick={() => void submit(gift.code)}
                title={gift.requires_vip && !isVip ? "Нужен VIP" : undefined}
                type="button"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#ff5d9a]/20 to-[#8254ed]/20 text-[#f4aed0]">
                  <BrandGiftIcon className="size-5" code={gift.code} />
                </span>
                <span className="mt-0.5 text-[9px] text-[#ffd35e]">
                  {gift.requires_vip && !isVip ? "VIP" : `${gift.price_stars} ⭐`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
