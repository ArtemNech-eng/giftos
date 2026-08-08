"use client";

import { useEffect, useMemo } from "react";
import { Check } from "lucide-react";

import { AnimatedArtifact } from "@/components/animated-artifact";
import { reasonLabel } from "@/lib/gift-reasons";

/**
 * Full-screen celebration after a gift is sent: the artifact pops in with a
 * light burst and confetti, then fades to a confirmation. Auto-dismisses.
 */
export function GiftSendCelebration({
  artworkPath,
  title,
  rarity,
  reason,
  onDone,
}: {
  artworkPath: string;
  title: string;
  rarity: string;
  reason: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        left: `${8 + ((index * 61) % 84)}%`,
        color: ["#ff5d9a", "#8254ed", "#ffd35e", "#4bc9ff", "#6bdbab"][index % 5],
        delay: `${(index % 6) * 0.08}s`,
      })),
    [],
  );

  const occasion = reasonLabel(reason);

  return (
    <div className="bg-[#17131f]/92 fixed inset-0 z-50 flex flex-col items-center justify-center px-6 backdrop-blur-sm">
      <div className="relative">
        <span className="gift-send-burst absolute inset-0 rounded-full bg-[radial-gradient(circle,#ffd35e66,transparent_60%)]" />
        <span className="gift-send-burst absolute inset-0 rounded-full bg-[radial-gradient(circle,#8254ed55,transparent_60%)] [animation-delay:0.15s]" />
        {confetti.map((piece, index) => (
          <span
            className="gift-send-confetti"
            key={index}
            style={{
              left: piece.left,
              background: piece.color,
              animationDelay: piece.delay,
            }}
          />
        ))}
        <div className="gift-send-pop w-44 overflow-hidden rounded-[1.6rem] bg-white p-2 shadow-[0_24px_60px_rgba(0,0,0,.5)]">
          <AnimatedArtifact
            className="aspect-square w-full rounded-[1.2rem]"
            rarity={rarity}
            src={artworkPath}
          />
        </div>
      </div>
      <div className="mt-6 text-center">
        <span className="mx-auto grid size-10 place-items-center rounded-full bg-[#6bdbab] text-[#0f2b1f]">
          <Check className="size-5" />
        </span>
        <h2 className="mt-4 text-xl font-black text-white">Подарок отправлен!</h2>
        {occasion && (
          <p className="mt-2 text-sm font-bold text-[#ffd35e]">
            {occasion.emoji} {occasion.label}
          </p>
        )}
        <p className="mt-1 text-sm text-white/70">{title}</p>
      </div>
    </div>
  );
}
