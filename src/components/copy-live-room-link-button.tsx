"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Round icon button that copies the current live room link.
 */
export function CopyLiveRoomLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/live/${slug}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; keep the button non-destructive.
    }
  }

  return (
    <button
      aria-label="Скопировать ссылку на эфир"
      className="bg-white/8 grid size-9 place-items-center rounded-full"
      onClick={() => void copy()}
      title={copied ? "Ссылка скопирована" : "Скопировать ссылку"}
      type="button"
    >
      {copied ? (
        <Check className="size-4 text-[#8df0b4]" />
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}
