"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Heart, RefreshCw } from "lucide-react";

/**
 * Route-level error boundary in product style. Any failed server action or
 * render shows this instead of the raw Next.js error screen — a calm,
 * branded message with a retry button (reset re-renders the segment).
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report the digest to the console for debugging; a real error tracker
    // would hook in here later.
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="landing-light relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f7f3fa] px-5 py-16 text-center text-[#201827]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-[-10rem] size-[26rem] rounded-full bg-[#ffc3dc]/70 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-[-12rem] size-[26rem] rounded-full bg-[#dfd2ff]/80 blur-[110px]"
      />

      <span className="relative inline-flex items-center gap-2 rounded-full border border-[#261b31]/10 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#8753e6] backdrop-blur">
        <RefreshCw className="size-3.5" /> Не получилось
      </span>
      <h1 className="relative mt-7 text-[clamp(2.6rem,8vw,4.5rem)] font-black leading-[0.9] tracking-[-0.08em]">
        Что-то пошло
        <span className="block text-[#e34f8a]">не так.</span>
      </h1>
      <p className="relative mt-4 max-w-md text-sm leading-6 text-[#6a5e73]">
        Не переживай — твои данные в порядке. Попробуй ещё раз, а если не получится,
        вернись на главную.
      </p>
      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-[#201827] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#4b2d66]"
          onClick={reset}
          type="button"
        >
          <RefreshCw className="size-4 transition-transform group-hover:rotate-180" />
          Попробовать снова
        </button>
        <Link
          className="inline-flex h-12 items-center gap-2 rounded-full border border-[#261b31]/10 bg-white/70 px-6 text-sm font-black text-[#8753e6] backdrop-blur transition hover:border-[#8753e6]/40"
          href="/"
        >
          <Heart className="size-4 fill-current" />
          На главную
        </Link>
      </div>
    </main>
  );
}
