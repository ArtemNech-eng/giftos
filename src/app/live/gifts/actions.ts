"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordCitySocialMoment } from "@/lib/city-social-moments";
import { requiredText } from "@/lib/validation";

export async function sendTestLiveGift(formData: FormData) {
  const { supabase, user } = await requireUser();
  const roomId = requiredText(formData.get("room_id"), 100);
  const slug = requiredText(formData.get("slug"), 100);
  const giftCode = requiredText(formData.get("gift_code"), 40);
  if (!roomId || !slug || !giftCode) throw new Error("Выберите подарок.");

  const [{ data: room }, { data: gift }] = await Promise.all([
    supabase
      .from("live_rooms")
      .select("id, host_id, status")
      .eq("id", roomId)
      .maybeSingle(),
    supabase
      .from("virtual_gifts")
      .select("code, price_minor, currency")
      .eq("code", giftCode)
      .eq("is_active", true)
      .maybeSingle(),
  ]);
  if (!room || room.status !== "live" || !gift || room.host_id === user.id)
    throw new Error("Подарок недоступен.");

  const admin = createAdminClient();
  const { data: sent, error } = await admin
    .from("live_room_gifts")
    .insert({
      room_id: room.id,
      sender_id: user.id,
      gift_code: gift.code,
      price_minor: gift.price_minor,
      currency: gift.currency,
    })
    .select("id")
    .single();
  if (error || !sent)
    throw new Error(
      `Не удалось отправить подарок: ${error?.message ?? "неизвестная ошибка"}`,
    );

  const gross = Number(gift.price_minor);
  const fee = Math.round(gross * 0.2);
  await admin.from("creator_ledger_entries").upsert(
    {
      creator_id: room.host_id,
      source_type: "gift",
      source_id: sent.id,
      gross_minor: gross,
      platform_fee_minor: fee,
      creator_net_minor: gross - fee,
      currency: gift.currency,
      status: "test",
    },
    { onConflict: "source_type,source_id" },
  );

  await recordCitySocialMoment({
    kind: "live_gift",
    actorId: user.id,
    subjectId: room.host_id,
    liveRoomId: room.id,
    giftCode: gift.code,
  });

  // No redirect: the gift event streams to every participant through
  // Realtime and is rendered as a story-like overlay on the room page.
  revalidatePath(`/live/${slug}`);
  revalidatePath("/creator/earnings");
}
