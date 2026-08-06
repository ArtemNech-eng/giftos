"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Round icon button that copies the fundraiser link. */
export function CopyFundraiserLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/fundraisers/${slug}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; keep the button non-destructive.
    }
  }

  return (
    <button
      aria-label="Скопировать ссылку на сбор"
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#ead9df] bg-white px-3 text-sm font-semibold text-[#765f66] transition hover:border-[#df4f7d]"
      onClick={() => void copy()}
      title={copied ? "Ссылка скопирована" : "Скопировать ссылку"}
      type="button"
    >
      {copied ? (
        <Check className="size-4 text-emerald-600" />
      ) : (
        <Copy className="size-4" />
      )}
      {copied ? "Скопировано" : "Поделиться"}
    </button>
  );
}
