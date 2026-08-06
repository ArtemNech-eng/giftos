"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CreatorShareLink({
  username,
  path,
  label,
  light = false,
}: {
  username?: string;
  path?: string;
  label?: string;
  light?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const targetPath = path ?? (username ? `/u/${username}` : "/");

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${targetPath}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
        light
          ? "border-[#2c2036]/10 bg-white text-[#5d5067] shadow-[0_5px_14px_rgba(67,41,90,0.06)]"
          : "border-white/15 bg-white/5 text-[#e5ddea]"
      }`}
      onClick={copyLink}
      type="button"
    >
      {copied ? (
        <Check className="size-4 text-[#b8ffcb]" />
      ) : (
        <Copy className="size-4" />
      )}
      {copied ? "Ссылка скопирована" : (label ?? "Скопировать ссылку")}
    </button>
  );
}
