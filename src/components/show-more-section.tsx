"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Feed section reveal: shows `step` items, then reveals more automatically
 * when the trigger enters the viewport (IntersectionObserver), with the
 * «Показать ещё» button as a manual fallback. The server already sends a
 * bounded batch — revealing more is instant, no extra requests.
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
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((value) => (value < children.length ? value + step : value));
        }
      },
      { rootMargin: "300px 0px" }, // start loading before the user reaches it
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [children.length, step]);

  if (children.length === 0) return <>{empty ?? null}</>;

  const hasMore = children.length > visible;

  return (
    <>
      {children.slice(0, visible)}
      {hasMore && (
        <>
          <div ref={sentinelRef} className="h-px" aria-hidden="true" />
          <button
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#2c2036]/10 bg-white py-3 text-xs font-black text-[#7549d0] shadow-[0_6px_18px_rgba(69,43,94,.05)] transition hover:border-[#b98ce9] hover:bg-[#fbf7ff]"
            onClick={() => setVisible((value) => value + step)}
            type="button"
          >
            <ChevronDown className="size-4" /> Показать ещё
          </button>
        </>
      )}
    </>
  );
}
