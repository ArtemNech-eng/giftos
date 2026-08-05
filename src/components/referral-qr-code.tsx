"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * Referral QR code: scan to open the personal invite link on the phone.
 */
export function ReferralQrCode({ url }: { url: string }) {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-2xl bg-white p-4">
      <QRCodeSVG
        bgColor="#ffffff"
        fgColor="#1b1528"
        level="M"
        marginSize={1}
        size={160}
        title="Реферальная ссылка"
        value={url}
      />
      <span className="text-xs font-semibold text-[#4a3d55]">
        Наведите камеру, чтобы открыть ссылку
      </span>
    </div>
  );
}
