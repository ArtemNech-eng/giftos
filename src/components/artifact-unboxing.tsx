"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Check, ChevronRight, Gem, Sparkles } from "lucide-react";

import { markCollectibleArtifactUnboxed } from "@/app/collection/actions";

export function ArtifactUnboxing({
  instanceId,
  artifact,
  profileHref,
  initiallyUnboxed,
}: {
  instanceId: string;
  artifact: {
    title: string;
    artworkPath: string;
    rarity: "limited" | "rare" | "iconic";
    serial: number;
    totalEdition: number;
  };
  profileHref: string;
  initiallyUnboxed: boolean;
}) {
  const [opened, setOpened] = useState(initiallyUnboxed);
  const [opening, setOpening] = useState(false);

  async function open() {
    if (opening || opened) return;
    setOpening(true);
    try {
      const formData = new FormData();
      formData.set("instance_id", instanceId);
      await markCollectibleArtifactUnboxed(formData);
      setOpened(true);
    } finally {
      setOpening(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col overflow-hidden bg-[#17131f] px-4 pb-8 pt-5 text-white">
      <header className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em] text-white/55">
        <span>ARTIFACTS 01</span>
        <span>{opened ? "В КОЛЛЕКЦИИ" : "ДЛЯ ТЕБЯ"}</span>
      </header>

      <section className="relative mt-5 flex grow flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_32%,rgba(181,139,242,.25),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(231,71,133,.17),transparent_35%),#211a2b] px-5 py-10 text-center shadow-[0_20px_50px_rgba(0,0,0,.25)]">
        <span className="bg-[#8a66d8]/16 absolute -left-12 top-16 size-40 rounded-full blur-3xl" />
        <span className="bg-[#e45890]/12 absolute -right-12 bottom-10 size-40 rounded-full blur-3xl" />
        <span className="bg-white/8 relative z-10 rounded-full border border-white/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#e6d7ff]">
          {artifact.rarity === "iconic"
            ? "ИКОНИЧЕСКИЙ ЭКЗЕМПЛЯР"
            : artifact.rarity === "rare"
              ? "РЕДКИЙ ЭКЗЕМПЛЯР"
              : "ЛИМИТИРОВАННЫЙ ЭКЗЕМПЛЯР"}
        </span>
        <div
          className={`bg-white/8 relative z-10 mt-8 w-56 overflow-hidden rounded-[1.6rem] border border-white/20 p-2 shadow-[0_20px_36px_rgba(0,0,0,.24)] transition duration-700 ${
            opened
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-[-3deg] scale-90 opacity-70"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- generated static pre-production artifact art */}
          <img
            loading="lazy"
            decoding="async"
            alt={opened ? artifact.title : "Артефакт ждёт распаковки"}
            className={`aspect-[3/4] w-full rounded-[1.2rem] object-cover transition duration-700 ${
              opened ? "blur-0" : "blur-sm"
            }`}
            src={artifact.artworkPath}
          />
          {!opened && (
            <span className="absolute inset-2 grid place-items-center rounded-[1.2rem] bg-[#17131f]/35">
              <Gem className="size-9 text-white/80" />
            </span>
          )}
        </div>

        {opened ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 relative z-10 mt-7 duration-500">
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#7549d0]">
              <Check className="size-5" />
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              {artifact.title}
            </h1>
            <p className="mt-2 text-sm text-white/70">Теперь он на твоей полке.</p>
            <span className="bg-white/12 mt-5 inline-flex rounded-full px-4 py-2 text-sm font-black text-[#f3e9ff]">
              #{artifact.serial} / {artifact.totalEdition}
            </span>
          </div>
        ) : (
          <div className="relative z-10 mt-7">
            <h1 className="text-2xl font-black tracking-[-0.06em]">
              Тебе подарили артефакт
            </h1>
            <p className="mt-2 text-[11px] leading-5 text-white/65">
              Предмет уже выбран. Открой его, чтобы увидеть свой экземпляр и номер.
            </p>
          </div>
        )}
      </section>

      {opened ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            className="bg-white/8 flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 py-3 text-[11px] font-black text-white"
            href="/collection"
          >
            Моя полка <ChevronRight className="size-3.5" />
          </Link>
          <Link
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3 text-[11px] font-black text-white"
            href={profileHref as Route}
          >
            В профиль <ChevronRight className="size-3.5" />
          </Link>
        </div>
      ) : (
        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(160,75,213,.3)] disabled:opacity-60"
          disabled={opening}
          onClick={() => void open()}
          type="button"
        >
          <Sparkles className="size-4" /> {opening ? "Открываем…" : "Открыть артефакт"}
        </button>
      )}
    </main>
  );
}
