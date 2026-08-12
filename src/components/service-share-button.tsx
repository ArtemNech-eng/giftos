"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * «Поделиться» for a service listing: copies the public link to the card.
 * The card has an OG image (type=service), so pasting the link into
 * WhatsApp/Telegram shows a beautiful card — free word-of-mouth for the
 * owner and for the platform.
 */
export function ServiceShareButton({
  serviceId,
  title,
  ownerName,
  cityName,
}: {
  serviceId: string;
  title: string;
  ownerName: string;
  cityName: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const origin = window.location.origin;
  const link = `${origin}/services/${serviceId}`;
  const ogTitle = `${title} · ${ownerName}`;
  const ogSubtitle = cityName
    ? `Нашли в витрине города ${cityName} — «Хочу также»`
    : "Нашли в витрине города — «Хочу также»";

  async function share() {
    const shareData = {
      title: ogTitle,
      text: ogSubtitle,
      url: link,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // User cancelled or share unsupported — fall through to copy.
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#2c2036]/10 bg-white py-3 text-xs font-black text-[#5f5369] transition hover:border-[#8753e6]/40"
      onClick={() => void share()}
      type="button"
    >
      {copied ? <Check className="size-4 text-[#19885e]" /> : <Share2 className="size-4" />}
      {copied ? "Ссылка скопирована" : "Поделиться"}
    </button>
  );
}
