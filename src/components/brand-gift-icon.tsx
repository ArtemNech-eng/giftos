import type { SVGProps } from "react";

type GiftVariant = "heart" | "fire" | "party" | "diamond" | "crown" | "default";

function variantFor(code: string): GiftVariant {
  if (code === "heart") return "heart";
  if (code === "fire") return "fire";
  if (code === "party") return "party";
  if (code === "diamond") return "diamond";
  if (code === "crown") return "crown";
  return "default";
}

/**
 * Product-native virtual gift glyphs. They replace OS-dependent emoji in
 * premium surfaces while gift codes stay stable in the database.
 */
export function BrandGiftIcon({
  code,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { code: string }) {
  const variant = variantFor(code);
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      {...props}
      {...common}
    >
      {variant === "heart" && (
        <path d="M20.7 5.8a5.1 5.1 0 0 0-7.2 0L12 7.3l-1.5-1.5a5.1 5.1 0 0 0-7.2 7.2L12 21.7l8.7-8.7a5.1 5.1 0 0 0 0-7.2Z" />
      )}
      {variant === "fire" && (
        <path d="M12.2 2.6c.5 4-2.9 5.1-2.9 8.1 0 1.4.9 2.6 2.4 2.6 2.3 0 2.8-2.7 1.5-4.5 4.5 2.2 5.3 5.3 4.2 8.3a6.2 6.2 0 0 1-11.6-.5C4.8 12.8 8.3 8.2 12.2 2.6Z" />
      )}
      {variant === "party" && (
        <>
          <path d="m5 19 8.3-8.3 5 5L10 24 5 19Z" />
          <path d="m8.3 15.7 4 4M14 7l1-3M19 10l3-1M17 5l2-2M20 15l3 1" />
          <path d="M4 8c1.1-1.2 2.8-1.2 3.9 0M3 12c1.4 1.1 3.2 1.1 4.6 0" />
        </>
      )}
      {variant === "diamond" && (
        <>
          <path d="m4 9 4-5h8l4 5-8 11L4 9Z" />
          <path d="m4 9h16M8 4l4 16M16 4l-4 16" />
        </>
      )}
      {variant === "crown" && (
        <>
          <path d="m4 7 4 4 4-7 4 7 4-4-2 11H6L4 7Z" />
          <path d="M6 21h12" />
        </>
      )}
      {variant === "default" && (
        <>
          <path d="M4 9h16v11H4zM3 9h18M12 9v11" />
          <path d="M8 9c-2.5 0-3.8-1.2-3.8-2.7C4.2 4.8 5.4 4 6.7 4 9 4 12 9 12 9S15 4 17.3 4c1.3 0 2.5.8 2.5 2.3C19.8 7.8 18.5 9 16 9" />
        </>
      )}
    </svg>
  );
}
