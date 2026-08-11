"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  QrCode,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { ReferralQrCode } from "@/components/referral-qr-code";
import { InvitePosterShare } from "@/components/invite-poster-share";

/**
 * «Приветствие по QR» — the flagship invite page: instead of a handshake,
 * show your phone with a QR code; the other person scans it and lands in
 * the app attached to you. Fullscreen QR mode for scanning from a distance.
 */
export function InviteScreen({
  name,
  cityName,
  reward,
  link,
  referralPath,
}: {
  name: string | null;
  cityName: string | null;
  reward: number;
  link: string;
  referralPath: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  function openFullscreen() {
    setFullscreen(true);
    void navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4fb] px-4 pb-12 pt-5 text-[#251d31]">
      <header className="flex items-center justify-between">
        <Link
          aria-label="Назад"
          className="border-[#2c2036]/9 grid size-10 place-items-center rounded-full border bg-white text-[#5f5369] shadow-[0_5px_15px_rgba(69,43,94,.05)]"
          href="/bonuses"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <span className="text-center">
          <small className="block text-[9px] font-black uppercase tracking-[0.13em] text-[#8c7e94]">
            Новая фишка
          </small>
          <h1 className="mt-0.5 text-sm font-black">Приветствие по QR</h1>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#f0e9ff] text-[#8753e6]">
          <QrCode className="size-4.5" />
        </span>
      </header>

      <section className="relative mt-5 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#2a1a4d] via-[#4b2f7a] to-[#7a4fd0] p-5 text-white shadow-[0_16px_36px_rgba(63,37,98,.25)]">
        <span className="bg-white/14 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#fbd7e7]">
          <UsersRound className="size-3.5" /> Вместо рукопожатия
        </span>
        <h2 className="mt-3 text-3xl font-black leading-[0.92] tracking-[-0.07em]">
          Встретил человека —
          <br />
          покажи телефон.
        </h2>
        <p className="mt-3 text-[11px] leading-5 text-white/75">
          Он сканирует QR — и сразу попадает в{" "}
          {cityName ? `${cityName} с бонусом` : "приложение с бонусом"}. Без поиска, без
          ссылок — просто показал и всё.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-black/20 px-3 py-2.5 text-[10px] font-bold text-[#ffd35e]">
          <Sparkles className="size-3.5 shrink-0" />
          {name
            ? `${name} · +${reward} ⭐ за каждого, кто пришёл по QR`
            : `+${reward} ⭐ за каждого, кто пришёл по QR`}
        </div>
      </section>

      <section className="border-[#2c2036]/9 mt-5 rounded-[1.7rem] border bg-white p-5 shadow-[0_10px_26px_rgba(69,43,94,.08)]">
        <div className="flex items-center justify-between">
          <span>
            <h3 className="text-xs font-black">Твой QR-код</h3>
            <p className="mt-0.5 text-[10px] text-[#81748a]">
              Наведи камеру — и ты в городе
            </p>
          </span>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-2 text-[10px] font-black text-[#5f5369]"
            onClick={openFullscreen}
            type="button"
          >
            <Maximize2 className="size-3.5" /> На весь экран
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          <ReferralQrCode cityName={cityName} premium reward={reward} url={link} />
        </div>
      </section>

      <section className="mt-5">
        <h3 className="text-xs font-black">Поделиться на расстоянии</h3>
        <InvitePosterShare
          cityName={cityName}
          inviterName={name}
          referralPath={referralPath}
          reward={reward}
        />
      </section>

      {fullscreen && (
        <div className="bg-[#0e0a18]/96 fixed inset-0 z-50 flex flex-col items-center justify-center px-6 backdrop-blur-sm">
          <button
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white"
            onClick={() => setFullscreen(false)}
            type="button"
          >
            <Minimize2 className="size-5" />
          </button>
          <p className="text-center text-lg font-black text-white">
            Покажи телефон — пусть отсканируют
          </p>
          <p className="mt-1 text-sm text-white/60">
            {cityName ? `Приглашение в ${cityName} · +${reward} ⭐` : `+${reward} ⭐`}
          </p>
          <div className="mt-6 scale-125">
            <ReferralQrCode
              cityName={cityName}
              premium
              pulse
              reward={reward}
              url={link}
            />
          </div>
          <p className="mt-5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-[#ffd35e]">
            {copied
              ? "Ссылка скопирована — отправь, если нужно"
              : "Ссылка уже скопирована"}
          </p>
          <p className="mt-8 max-w-60 text-center text-xs leading-5 text-white/50">
            Работает как рукопожатие: человек сканирует, регистрируется — и вы оба
            получаете бонус.
          </p>
        </div>
      )}
    </main>
  );
}
