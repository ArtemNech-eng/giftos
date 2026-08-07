"use client";

import { useState } from "react";
import { Gem, HandCoins } from "lucide-react";

import { requestCreatorArtifact } from "@/app/creator/artifact-requests/actions";
import { AnimatedArtifact } from "@/components/animated-artifact";

type Artifact = {
  id: string;
  title: string;
  artworkPath: string;
  remainingEdition: number;
  totalEdition: number;
  priceStars: number;
};

/**
 * Support-artifact request for creators: the sender picks a known artifact
 * and a note; the creator accepts or rejects. The sender is charged only
 * after acceptance (80/20 test ledger).
 */
export function CreatorArtifactRequestButton({
  creatorId,
  username,
  artifacts,
}: {
  creatorId: string;
  username: string;
  artifacts: Artifact[];
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(seriesId: string) {
    if (busy) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("creator_id", creatorId);
      formData.set("series_id", seriesId);
      formData.set("username", username);
      await requestCreatorArtifact(formData);
      setSent(true);
      setOpen(false);
    } catch {
      // Surface the server error message to the user.
      setBusy(false);
      setOpen(false);
    }
  }

  if (sent) {
    return (
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#e4f7ed] px-3 text-xs font-black text-[#19885e]"
        disabled
        type="button"
      >
        <HandCoins className="size-4" /> Запрос отправлен
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9c5f3] bg-white px-3 text-xs font-black text-[#7549d0] shadow-[0_5px_12px_rgba(69,43,94,.06)] transition hover:border-[#b98ce9]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Gem className="size-4" /> Поддержать артефактом
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[318px] rounded-[1.4rem] border border-[#e2d8e9] bg-white p-3 shadow-[0_18px_40px_rgba(69,43,94,.18)]">
          <div className="flex items-start gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
              <HandCoins className="size-4" />
            </span>
            <span>
              <b className="block text-xs text-[#4e4258]">Поддержка автора</b>
              <small className="mt-0.5 block text-[9px] leading-4 text-[#81748a]">
                Автор решит, принять ли. ⭐ спишутся только после принятия, 80% —
                автору.
              </small>
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {artifacts.map((artifact) => (
              <button
                className="overflow-hidden rounded-xl border border-[#e8dfea] bg-[#fbf9fe] text-left transition hover:border-[#bb91e5] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={busy || artifact.remainingEdition <= 0}
                key={artifact.id}
                onClick={() => void send(artifact.id)}
                type="button"
              >
                <AnimatedArtifact
                  className="aspect-square w-full"
                  rarity="limited"
                  src={artifact.artworkPath}
                />
                <span className="block p-2">
                  <b className="block truncate text-[10px] text-[#51445b]">
                    {artifact.title}
                  </b>
                  <small className="mt-0.5 flex items-center justify-between text-[8px] font-bold text-[#8b6a9c]">
                    <span>
                      {artifact.remainingEdition} / {artifact.totalEdition}
                    </span>
                    <span>{artifact.priceStars} ⭐</span>
                  </small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
