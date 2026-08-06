"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { inviteProfileToPlace } from "@/app/places/actions";
import { PlaceIcon } from "@/components/place-icon";

/**
 * «Позвать в тусовку» button on a person's card inside a place: pick one
 * of my hangouts and invite the person into it.
 */
export function PlaceInviteButton({
  profileId,
  returnTo,
  places,
}: {
  profileId: string;
  returnTo: string;
  places: Array<{ id: string; name: string; icon_code: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(placeId: string) {
    if (busy) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("place_id", placeId);
      formData.set("profile_id", profileId);
      formData.set("return_to", returnTo);
      await inviteProfileToPlace(formData);
    } catch {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-1 rounded-full border border-[#d9c5f3] bg-[#f3edff] px-2.5 py-1 text-xs font-semibold text-[#7549d0] transition hover:border-[#ad7bf4]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <UserPlus className="size-3.5" /> Позвать
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-[#2c2036]/10 bg-white p-3 shadow-[0_12px_28px_rgba(69,43,94,.14)]">
          <p className="text-xs font-bold text-[#251d31]">Позвать в тусовку</p>
          <div className="mt-2 space-y-1.5">
            {places.map((place) => (
              <button
                className="flex w-full items-center gap-2 rounded-xl border border-[#2c2036]/10 bg-[#faf7fc] px-2 py-1.5 text-left text-xs transition hover:border-[#ad7bf4] disabled:opacity-50"
                disabled={busy}
                key={place.id}
                onClick={() => void submit(place.id)}
                type="button"
              >
                <PlaceIcon
                  className="size-4 shrink-0 text-[#8753e6]"
                  code={place.icon_code}
                />
                <span className="truncate font-semibold">{place.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
