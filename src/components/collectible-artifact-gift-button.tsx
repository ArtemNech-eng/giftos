"use client";

import { useState } from "react";
import { Gem, Sparkles } from "lucide-react";

import { sendCollectibleArtifact } from "@/app/collection/actions";

type Artifact = {
  id: string;
  title: string;
  artworkPath: string;
  rarity: string;
  remainingEdition: number;
  totalEdition: number;
  priceStars: number;
};

/** Profile-level picker for known limited artifacts. No random box is used. */
export function CollectibleArtifactGiftButton({
  recipientId,
  username,
  artifacts,
}: {
  recipientId: string;
  username: string;
  artifacts: Artifact[];
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(seriesId: string) {
    if (busy) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("recipient_id", recipientId);
      formData.set("series_id", seriesId);
      formData.set("username", username);
      await sendCollectibleArtifact(formData);
    } catch {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9c5f3] bg-white px-3 text-xs font-black text-[#7549d0] shadow-[0_5px_12px_rgba(69,43,94,.06)] transition hover:border-[#b98ce9]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Gem className="size-4" /> Артефакт
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[318px] rounded-[1.4rem] border border-[#e2d8e9] bg-white p-3 shadow-[0_18px_40px_rgba(69,43,94,.18)]">
          <div className="flex items-start gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
              <Sparkles className="size-4" />
            </span>
            <span>
              <b className="block text-xs text-[#4e4258]">ARTIFACTS 01</b>
              <small className="mt-0.5 block text-[9px] leading-4 text-[#81748a]">
                Ты видишь предмет заранее. Номер появится после вручения.
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
                {/* eslint-disable-next-line @next/next/no-img-element -- generated static pre-production artifact art */}
                <img
                  alt=""
                  className="aspect-[3/2] w-full object-cover"
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
