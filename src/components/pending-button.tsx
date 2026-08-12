"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

/**
 * Submit button with pending state (prevents double submits — a repeated
 * tap on a slow connection would otherwise create duplicate listings).
 * Brand gradient style, matches the app's primary CTA.
 */
export function PendingButton({
  children,
  pendingLabel = "Сохраняем…",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.24)] transition disabled:pointer-events-none disabled:opacity-60 ${className}`}
      disabled={pending}
      type="submit"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
