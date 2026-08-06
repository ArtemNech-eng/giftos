"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";

/**
 * Web push opt-in button.
 * Requires NEXT_PUBLIC_VAPID_PUBLIC_KEY; without it the button is hidden.
 */
export function PushNotificationButton() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !publicKey
    ) {
      setSupported(false);
      return;
    }
    setSupported(true);
    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setEnabled(Boolean(subscription)))
      .catch(() => setEnabled(false));
  }, [publicKey]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      if (current) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: current.endpoint }),
        });
        await current.unsubscribe();
        setEnabled(false);
      } else {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey!),
        });
        const response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
        if (!response.ok) throw new Error("Не удалось сохранить подписку.");
        setEnabled(true);
      }
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name === "NotAllowedError"
          ? "Вы отклонили разрешение в браузере."
          : "Не удалось включить уведомления.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div>
      <button
        className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold ${
          enabled
            ? "border border-[#6fe3a1]/40 bg-[#15281d] text-[#8df0b4]"
            : "bg-gradient-to-r from-[#ff4b8a] to-[#7d45ff] text-white"
        }`}
        disabled={busy}
        onClick={() => void toggle()}
        type="button"
      >
        {enabled ? <BellRing className="size-4" /> : <Bell className="size-4" />}
        {enabled ? "Уведомления включены" : "Включить уведомления"}
      </button>
      {error && <p className="mt-2 text-xs text-[#ff9bc5]">{error}</p>}
    </div>
  );
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64url);
  return new Uint8Array([...raw].map((char) => char.charCodeAt(0)));
}
