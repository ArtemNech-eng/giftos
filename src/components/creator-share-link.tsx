"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CreatorShareLink({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/u/${username}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-[#e5ddea]"
      onClick={copyLink}
      type="button"
    >
      {copied ? (
        <Check className="size-4 text-[#b8ffcb]" />
      ) : (
        <Copy className="size-4" />
      )}
      {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
    </button>
  );
}
