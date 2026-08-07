"use client";

import { useMemo } from "react";

/**
 * Animated artifact figure: the static art floats, glows with a rarity
 * colour, sparkles with golden particles, and (for iconic pieces) orbits a
 * light ring. Pure CSS, GPU-friendly (transform/opacity), respects
 * prefers-reduced-motion. The sparkle positions are memoised per render.
 */
export function AnimatedArtifact({
  src,
  alt = "",
  rarity = "limited",
  className = "",
  orbit = false,
  sparkles = 6,
}: {
  src: string;
  alt?: string;
  rarity?: "limited" | "rare" | "iconic" | string;
  className?: string;
  orbit?: boolean;
  sparkles?: number;
}) {
  const glowColor = useMemo(() => {
    if (rarity === "iconic") return "rgba(255, 200, 130, 0.6)";
    if (rarity === "rare") return "rgba(217, 130, 255, 0.55)";
    return "rgba(167, 122, 231, 0.5)";
  }, [rarity]);

  const sparklePositions = useMemo(
    () =>
      Array.from({ length: sparkles }, (_, index) => ({
        left: `${12 + ((index * 37) % 76)}%`,
        top: `${14 + ((index * 53) % 66)}%`,
        animationDelay: `${(index % 5) * 0.45}s`,
        animationDuration: `${2 + (index % 3) * 0.5}s`,
      })),
    [sparkles],
  );

  return (
    <div
      className={`artifact-animated ${className}`}
      style={{ "--artifact-glow": glowColor } as React.CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static pre-production artifact art */}
      <img
        alt={alt}
        className="relative z-10 size-full rounded-[inherit] object-cover"
        decoding="async"
        loading="lazy"
        src={src}
      />
      <span className="artifact-shine z-20" />
      {orbit && <span className="artifact-ring z-20" />}
      <span className="artifact-sparkles z-30">
        {sparklePositions.map((position, index) => (
          <i
            key={index}
            style={{
              left: position.left,
              top: position.top,
              animationDelay: position.animationDelay,
              animationDuration: position.animationDuration,
            }}
          />
        ))}
      </span>
    </div>
  );
}
