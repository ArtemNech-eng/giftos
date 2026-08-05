"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requiredText } from "@/lib/validation";

export async function sendTestFundraiserGift(formData: FormData) {
  const { supabase, user } = await requireUser();
  const fundraiserId = requiredText(formData.get("fundraiser_id"), 100);
  const slug = requiredText(formData.get("slug"), 100);
  const giftCode = requiredText(formData.get("gift_code"), 40);
  if (!fundraiserId || !slug || !giftCode) throw new Error("Выберите подарок.");

  const [{ data: fundraiser }, { data: gift }] = await Promise.all([
    supabase
      .from("fundraisers")
      .select("id, author_id, status")
      .eq("id", fundraiserId)
      .maybeSingle(),
    supabase
      .from("virtual_gifts")
      .select("code, price_minor, currency")
      .eq("code", giftCode)
      .eq("is_active", true)
      .maybeSingle(),
  ]);
  if (
    !fundraiser ||
    !gift ||
    fundraiser.status === "draft" ||
    fundraiser.author_id === user.id
  )
    throw new Error("Подарок недоступен.");

  const admin = createAdminClient();
  const { data: sent, error } = await admin
    .from("fundraiser_gifts")
    .insert({
      fundraiser_id: fundraiser.id,
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
  const { error: ledgerError } = await admin.from("creator_ledger_entries").insert({
    creator_id: fundraiser.author_id,
    source_type: "gift",
    source_id: sent.id,
    gross_minor: gross,
    platform_fee_minor: fee,
    creator_net_minor: gross - fee,
    currency: gift.currency,
    status: "test",
  });
  if (ledgerError)
    throw new Error(`Не удалось начислить тестовый доход: ${ledgerError.message}`);

  // Notify the fundraiser author about the gift.
  await admin.from("notifications").insert({
    recipient_id: fundraiser.author_id,
    actor_id: user.id,
    type: "fundraiser_gift",
    entity_type: "fundraiser",
    entity_id: fundraiser.id,
    payload: { gift_code: gift.code, slug },
  });

  // No redirect: the gift streams through Realtime to everyone in the room.
  revalidatePath(`/fundraisers/${slug}`);
  revalidatePath("/creator/earnings");
  redirect(`/fundraisers/${slug}?gift=sent` as Route);
}
