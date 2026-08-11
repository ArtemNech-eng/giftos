"use client";

import { MapPin, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Heart } from "lucide-react";

/**
 * Referral QR code: scan to open a personal invite link. When a city is
 * attached, the recipient sees its context before registration.
 * `premium` adds a gradient look + brand center mark (HTML overlay — keeps
 * the QR scannable); `pulse` wraps it in an attention ring.
 */
export function ReferralQrCode({
  url,
  cityName,
  reward,
  premium = false,
  pulse = false,
}: {
  url: string;
  cityName?: string | null;
  reward?: number;
  premium?: boolean;
  pulse?: boolean;
}) {
  return (
    <div
      className={`w-full max-w-[250px] rounded-[1.45rem] bg-white p-3.5 text-[#291c34] shadow-[0_16px_35px_rgba(0,0,0,0.18)] ${
        pulse ? "qr-pulse" : ""
      }`}
    >
      {(cityName || reward) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {cityName ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-black text-[#68418e]">
              <MapPin className="size-3.5 shrink-0 text-[#a057e5]" />
              <span className="truncate">В {cityName}</span>
            </span>
          ) : (
            <span className="text-xs font-black text-[#68418e]">Твоё приглашение</span>
          )}
          {reward ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff0a9] px-2 py-1 text-[10px] font-black text-[#735417]">
              <Sparkles className="size-3" /> +{reward} ⭐
            </span>
          ) : null}
        </div>
      )}
      <div
        className={`relative grid place-items-center rounded-xl p-2.5 ${
          premium ? "bg-gradient-to-br from-[#f3ecff] to-[#fff0f6]" : "bg-[#faf8fc]"
        }`}
      >
        <div className={premium ? "rounded-lg bg-white p-1" : ""}>
          <QRCodeSVG
            bgColor={premium ? "#ffffff" : "#faf8fc"}
            fgColor="#24172e"
            level="M"
            marginSize={1}
            size={premium ? 150 : 160}
            title={cityName ? `Приглашение в ${cityName}` : "Реферальная ссылка"}
            value={url}
          />
        </div>
        {premium && (
          <span className="pointer-events-none absolute grid size-9 place-items-center rounded-lg bg-gradient-to-br from-[#ff5d9a] to-[#8254ed] text-white shadow-[0_4px_12px_rgba(160,75,213,.4)]">
            <Heart className="size-4 fill-current" />
          </span>
        )}
      </div>
      <span className="mt-3 block text-center text-xs font-semibold leading-5 text-[#65546d]">
        {cityName
          ? `Сканируй — попадёшь в ${cityName}`
          : "Наведи камеру, чтобы открыть приглашение"}
      </span>
    </div>
  );
}
