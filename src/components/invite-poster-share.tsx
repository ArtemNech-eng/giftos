"use client";

import { useState } from "react";
import { Check, ImageIcon } from "lucide-react";

/**
 * Share the invite poster: shows a preview of the generated OG image
 * (/og?type=invite) and copies the poster URL — the recipient opens a
 * beautiful card with the invite in WhatsApp/Telegram.
 */
export function InvitePosterShare({
  cityName,
  inviterName,
  reward,
  referralPath,
}: {
  cityName: string | null;
  inviterName: string | null;
  reward: number;
  referralPath: string;
}) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}${referralPath}`;
  const title = inviterName
    ? `${inviterName} зовёт тебя в ${cityName ?? "город"}`
    : `Тебя зовут в ${cityName ?? "город"}`;
  const posterUrl = `${window.location.origin}/og?type=invite&title=${encodeURIComponent(
    title,
  )}&subtitle=${encodeURIComponent(
    `Забери свой бонус +${reward} ⭐. Твоя ссылка: ${inviteLink}`,
  )}`;

  async function copyPoster() {
    await navigator.clipboard.writeText(posterUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-4">
      <div className="overflow-hidden rounded-2xl border border-[#2c2036]/10 shadow-[0_8px_22px_rgba(69,43,94,.08)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated poster preview */}
        <img
          alt="Постер приглашения"
          className="aspect-[1200/630] w-full object-cover"
          decoding="async"
          loading="lazy"
          src={posterUrl}
        />
      </div>
      <button
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3 text-xs font-black text-white shadow-[0_8px_18px_rgba(160,75,213,.24)]"
        onClick={copyPoster}
        type="button"
      >
        {copied ? <Check className="size-4" /> : <ImageIcon className="size-4" />}
        {copied ? "Ссылка на постер скопирована" : "Поделиться постером"}
      </button>
      <p className="mt-1.5 text-[10px] leading-4 text-[#8a7d91]">
        Отправь картинку в чаты города — по ней откроется красивое приглашение.
      </p>
    </div>
  );
}
