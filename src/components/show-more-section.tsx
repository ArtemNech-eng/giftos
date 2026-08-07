"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Client-side «Показать ещё» for feed sections. The server already sends a
 * bounded batch (6–12 items); revealing more is instant, no extra requests,
 * no layout jump, and the button disappears when the batch is exhausted.
 */
export function ShowMoreSection({
  step = 5,
  children,
  empty,
}: {
  step?: number;
  children: ReactNode[];
  empty?: ReactNode;
}) {
  const [visible, setVisible] = useState(step);

  if (children.length === 0) return <>{empty ?? null}</>;

  return (
    <>
      {children.slice(0, visible)}
      {children.length > visible && (
        <button
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#2c2036]/10 bg-white py-3 text-xs font-black text-[#7549d0] shadow-[0_6px_18px_rgba(69,43,94,.05)] transition hover:border-[#b98ce9] hover:bg-[#fbf7ff]"
          onClick={() => setVisible((value) => value + step)}
          type="button"
        >
          <ChevronDown className="size-4" /> Показать ещё
        </button>
      )}
    </>
  );
}
