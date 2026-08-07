"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordCitySocialMoment } from "@/lib/city-social-moments";
import { requiredText } from "@/lib/validation";

export async function sendTestStoryGift(formData: FormData) {
  const { supabase, user } = await requireUser();
  const storyId = requiredText(formData.get("story_id"), 100);
  const giftCode = requiredText(formData.get("gift_code"), 40);
  if (!storyId || !giftCode) throw new Error("Выберите подарок.");

  const [{ data: story }, { data: gift }] = await Promise.all([
    supabase
      .from("stories")
      .select("id, author_id, expires_at")
      .eq("id", storyId)
      .maybeSingle(),
    supabase
      .from("virtual_gifts")
      .select("code, price_minor, currency")
      .eq("code", giftCode)
      .eq("is_active", true)
      .maybeSingle(),
  ]);
  if (!story || !gift || new Date(story.expires_at) <= new Date())
    throw new Error("Подарок недоступен.");
  if (story.author_id === user.id)
    throw new Error("Нельзя отправить подарок самому себе.");

  const admin = createAdminClient();
  const { data: storyGift, error } = await admin
    .from("story_gifts")
    .insert({
      story_id: story.id,
      sender_id: user.id,
      gift_code: gift.code,
      price_minor: gift.price_minor,
      currency: gift.currency,
    })
    .select("id")
    .single();
  if (error || !storyGift)
    throw new Error(
      `Не удалось отправить подарок: ${error?.message ?? "неизвестная ошибка"}`,
    );

  const gross = Number(gift.price_minor);
  const fee = Math.round(gross * 0.2);
  const { error: ledgerError } = await admin.from("creator_ledger_entries").insert({
    creator_id: story.author_id,
    source_type: "gift",
    source_id: storyGift.id,
    gross_minor: gross,
    platform_fee_minor: fee,
    creator_net_minor: gross - fee,
    currency: gift.currency,
    status: "test",
  });
  if (ledgerError)
    throw new Error(`Не удалось начислить тестовый доход: ${ledgerError.message}`);

  await recordCitySocialMoment({
    kind: "story_gift",
    actorId: user.id,
    subjectId: story.author_id,
    storyId: story.id,
    giftCode: gift.code,
  });

  revalidatePath(`/stories/${story.id}`);
  revalidatePath("/creator/earnings");
  redirect(`/stories/${story.id}?gift=sent` as Route);
}
