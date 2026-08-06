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
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1cff2] bg-white px-3 text-xs font-black text-[#7549d0] shadow-[0_5px_12px_rgba(69,43,94,.06)] transition hover:border-[#b98ce9]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Gift className="size-4" /> Подарок
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-[#e2d8e9] bg-white p-3 shadow-[0_16px_32px_rgba(69,43,94,.16)]">
          <p className="text-xs font-black text-[#5f5269]">
            Выбери подарок за Хочу-бонусы
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {gifts.map((gift) => (
              <button
                className="flex flex-col items-center rounded-xl border border-[#e9e0ee] bg-[#fbf8fd] px-1 py-1.5 transition hover:border-[#c49aeb] disabled:opacity-50"
                disabled={busy || (gift.requires_vip && !isVip)}
                key={gift.code}
                onClick={() => void submit(gift.code)}
                title={gift.requires_vip && !isVip ? "Нужен VIP" : undefined}
                type="button"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#fff0f6] to-[#f0e9ff] text-[#8753e6]">
                  <BrandGiftIcon className="size-5" code={gift.code} />
                </span>
                <span className="mt-0.5 text-[9px] font-bold text-[#8b6a9c]">
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
