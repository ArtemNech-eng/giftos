"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * QR code of the author profile page. Scan with a phone camera to open the
 * profile without typing the link.
 */
export function ProfileQrCode({ url, name }: { url: string; name: string }) {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-2xl bg-white p-4">
      <QRCodeSVG
        bgColor="#ffffff"
        fgColor="#1b1528"
        level="M"
        marginSize={1}
        size={160}
        title={name}
        value={url}
      />
      <span className="text-xs font-semibold text-[#4a3d55]">
        Наведите камеру, чтобы открыть профиль
      </span>
    </div>
  );
}
