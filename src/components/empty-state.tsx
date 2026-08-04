import Link from "next/link";
import type { Route } from "next";
import { Sparkles } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: Route;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#ead9df] bg-[#fffdfd] px-6 py-10 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-[#fce5ec] text-[#d34872]">
        <Sparkles className="size-5" />
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#826c73]">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#df4f7d] px-4 text-sm font-semibold text-white transition hover:bg-[#c93f6d]"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
