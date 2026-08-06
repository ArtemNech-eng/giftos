"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordCitySocialMoment } from "@/lib/city-social-moments";
import { requiredText } from "@/lib/validation";

export async function sendTestLiveDonation(formData: FormData) {
  const { supabase, user } = await requireUser();
  const roomId = requiredText(formData.get("room_id"), 100);
  const slug = requiredText(formData.get("slug"), 100);
  const message = requiredText(formData.get("message"), 500);
  const amountRubles = Number(requiredText(formData.get("amount_rubles"), 8));
  if (!roomId || !slug || !message || !Number.isFinite(amountRubles))
    throw new Error("Укажите сумму и сообщение.");
  if (!Number.isInteger(amountRubles) || amountRubles < 1 || amountRubles > 100000)
    throw new Error("Сумма доната — целое число от 1 до 100 000 ₽.");

  const { data: room } = await supabase
    .from("live_rooms")
    .select("id, host_id, status")
    .eq("id", roomId)
    .maybeSingle();
  if (!room || room.status !== "live") throw new Error("Эфир недоступен.");
  if (room.host_id === user.id) throw new Error("Нельзя донатить самому себе.");

  const amountMinor = amountRubles * 100;
  const admin = createAdminClient();
  const { data: sent, error } = await admin
    .from("live_room_donations")
    .insert({
      room_id: room.id,
      sender_id: user.id,
      message,
      amount_minor: amountMinor,
      currency: "RUB",
    })
    .select("id")
    .single();
  if (error || !sent)
    throw new Error(
      `Не удалось отправить донат: ${error?.message ?? "неизвестная ошибка"}`,
    );

  const gross = amountMinor;
  const fee = Math.round(gross * 0.2);
  await admin.from("creator_ledger_entries").upsert(
    {
      creator_id: room.host_id,
      source_type: "live_donation",
      source_id: sent.id,
      gross_minor: gross,
      platform_fee_minor: fee,
      creator_net_minor: gross - fee,
      currency: "RUB",
      status: "test",
    },
    { onConflict: "source_type,source_id" },
  );

  await recordCitySocialMoment({
    kind: "live_donation",
    actorId: user.id,
    subjectId: room.host_id,
    liveRoomId: room.id,
  });

  // No redirect: the donation streams to every participant through Realtime
  // and is rendered as an overlay banner over the media area.
  revalidatePath(`/live/${slug}`);
  revalidatePath("/creator/earnings");
}
