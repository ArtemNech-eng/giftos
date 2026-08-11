"use client";

import { useState } from "react";
import { ArrowLeft, Gem, HandCoins } from "lucide-react";

import { requestCreatorArtifact } from "@/app/creator/artifact-requests/actions";
import { AnimatedArtifact } from "@/components/animated-artifact";
import { GIFT_COLLECTIONS } from "@/lib/gift-collections";
import { GIFT_REASONS } from "@/lib/gift-reasons";

type Artifact = {
  id: string;
  title: string;
  artworkPath: string;
  collectionSlug: string | null;
  remainingEdition: number;
  totalEdition: number;
  priceStars: number;
};

/**
 * Support-artifact request for creators: pick a gift → pick an occasion →
 * the creator accepts or rejects. The sender is charged only after
 * acceptance (80/20 test ledger).
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
  const [tab, setTab] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const visibleArtifacts =
    tab === "all"
      ? artifacts
      : artifacts.filter((artifact) => artifact.collectionSlug === tab);
  const selected = artifacts.find((artifact) => artifact.id === selectedId) ?? null;

  async function send(reason: string | null) {
    if (busy || !selectedId) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("creator_id", creatorId);
      formData.set("series_id", selectedId);
      formData.set("username", username);
      if (reason) formData.set("reason", reason);
      await requestCreatorArtifact(formData);
      setSent(true);
      setOpen(false);
    } catch {
      setBusy(false);
      setOpen(false);
      setSelectedId(null);
      setSelectedReason(null);
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
        onClick={() => {
          setOpen((value) => !value);
          setSelectedId(null);
          setSelectedReason(null);
        }}
        type="button"
      >
        <Gem className="size-4" /> Поддержать подарком
      </button>
      {open && (
        <div className="fixed inset-x-4 top-14 z-50 mx-auto max-h-[calc(100dvh-5rem)] w-auto max-w-[318px] overflow-y-auto rounded-[1.4rem] border border-[#e2d8e9] bg-white p-3 shadow-[0_18px_40px_rgba(69,43,94,.18)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[318px] sm:max-w-none">
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  className="grid size-7 place-items-center rounded-full bg-[#f3eef7] text-[#756a7d]"
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedReason(null);
                  }}
                  type="button"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <b className="text-xs text-[#4e4258]">Повод</b>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#fbf9fe] p-2">
                <span className="w-14 shrink-0 overflow-hidden rounded-lg">
                  <AnimatedArtifact
                    className="aspect-square w-full"
                    rarity="limited"
                    src={selected.artworkPath}
                  />
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-[11px]">{selected.title}</b>
                  <small className="text-[9px] font-bold text-[#8b6a9c]">
                    {selected.priceStars} ⭐
                  </small>
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {GIFT_REASONS.map((reason) => (
                  <button
                    className={`rounded-xl border px-2 py-2 text-[10px] font-black transition ${
                      selectedReason === reason.code
                        ? "border-[#9a62eb] bg-[#f0e9ff] text-[#7549d0]"
                        : "border-[#2c2036]/10 bg-[#fbf9fe] text-[#5f5369] hover:border-[#bb91e5]"
                    }`}
                    key={reason.code}
                    onClick={() => {
                      setSelectedReason(reason.code);
                      void send(reason.code);
                    }}
                    type="button"
                  >
                    {reason.emoji} {reason.label}
                  </button>
                ))}
              </div>
              <button
                className="mt-3 w-full rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] py-2 text-[10px] font-black text-[#5f5369]"
                disabled={busy}
                onClick={() => void send(null)}
                type="button"
              >
                {busy ? "Отправляем…" : "Без повода"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-[#f0e9ff] text-[#8753e6]">
                  <HandCoins className="size-4" />
                </span>
                <span>
                  <b className="block text-xs text-[#4e4258]">Поддержка подарком</b>
                  <small className="mt-0.5 block text-[9px] leading-4 text-[#81748a]">
                    Автор решит, принять ли. ⭐ спишутся после принятия, 80% — автору.
                  </small>
                </span>
              </div>
              <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">
                <button
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black transition ${
                    tab === "all"
                      ? "bg-gradient-to-r from-[#8254ed] to-[#ff5d9a] text-white"
                      : "border border-[#2c2036]/10 bg-[#fbf9fe] text-[#756a7d]"
                  }`}
                  onClick={() => setTab("all")}
                  type="button"
                >
                  Все
                </button>
                {GIFT_COLLECTIONS.map((collection) => (
                  <button
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black transition ${
                      tab === collection.slug
                        ? "bg-gradient-to-r from-[#8254ed] to-[#ff5d9a] text-white"
                        : "border border-[#2c2036]/10 bg-[#fbf9fe] text-[#756a7d]"
                    }`}
                    key={collection.slug}
                    onClick={() => setTab(collection.slug)}
                    type="button"
                  >
                    {collection.icon} {collection.label}
                  </button>
                ))}
              </nav>
              <div className="mt-2 max-h-80 overflow-y-auto pr-0.5">
                <div className="grid grid-cols-2 gap-2">
                  {visibleArtifacts.map((artifact) => (
                    <button
                      className="overflow-hidden rounded-xl border border-[#e8dfea] bg-[#fbf9fe] text-left transition hover:border-[#bb91e5] disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={busy || artifact.remainingEdition <= 0}
                      key={artifact.id}
                      onClick={() => setSelectedId(artifact.id)}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
