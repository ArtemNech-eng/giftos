"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseAmountToMinor } from "@/lib/money";
import { requiredText } from "@/lib/validation";

export async function updateCreatorSubscriptionSettings(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = requiredText(formData.get("username"), 100);
  const enabled = formData.get("subscriptions_enabled") === "on";
  const price = parseAmountToMinor(formData.get("subscription_price"));
  if (!username) throw new Error("Профиль не найден.");
  if (enabled && (!price || price <= 0)) throw new Error("Укажите стоимость подписки.");

  const { error } = await supabase
    .from("profiles")
    .update({
      subscriptions_enabled: enabled,
      subscription_price_minor: enabled ? price : null,
    })
    .eq("id", user.id);
  if (error) throw new Error(`Не удалось сохранить подписку: ${error.message}`);
  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}` as Route);
}

export async function cancelCreatorSubscription(formData: FormData) {
  const { supabase, user } = await requireUser();
  const creatorId = requiredText(formData.get("creator_id"), 100);
  const username = requiredText(formData.get("username"), 100);
  if (!creatorId || !username || creatorId === user.id)
    throw new Error("Не удалось отменить подписку.");

  const { error } = await supabase
    .from("creator_subscriptions")
    .update({ status: "cancelled" })
    .eq("creator_id", creatorId)
    .eq("subscriber_id", user.id)
    .eq("status", "active");
  if (error) throw new Error(`Не удалось отменить подписку: ${error.message}`);

  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}?unsubscribed=1` as Route);
}

export async function testSubscribeToCreator(formData: FormData) {
  const { supabase, user } = await requireUser();
  const creatorId = requiredText(formData.get("creator_id"), 100);
  const username = requiredText(formData.get("username"), 100);
  if (!creatorId || !username || creatorId === user.id)
    throw new Error("Не удалось оформить подписку.");

  const { data: creator } = await supabase
    .from("profiles")
    .select("id, subscriptions_enabled, subscription_price_minor, profile_visibility")
    .eq("id", creatorId)
    .maybeSingle();
  if (
    !creator?.subscriptions_enabled ||
    !creator.subscription_price_minor ||
    creator.profile_visibility !== "public"
  )
    throw new Error("Автор сейчас не принимает подписки.");

  const admin = createAdminClient();
  const { data: subscription, error } = await admin
    .from("creator_subscriptions")
    .upsert(
      {
        creator_id: creator.id,
        subscriber_id: user.id,
        price_minor: creator.subscription_price_minor,
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "creator_id,subscriber_id" },
    )
    .select("id")
    .single();
  if (error || !subscription)
    throw new Error(
      `Не удалось создать тестовую подписку: ${error?.message ?? "неизвестная ошибка"}`,
    );

  const gross = Number(creator.subscription_price_minor);
  const fee = Math.round(gross * 0.2);
  const { error: ledgerError } = await admin.from("creator_ledger_entries").upsert(
    {
      creator_id: creator.id,
      source_type: "subscription",
      source_id: subscription.id,
      gross_minor: gross,
      platform_fee_minor: fee,
      creator_net_minor: gross - fee,
      status: "test",
    },
    { onConflict: "source_type,source_id" },
  );
  if (ledgerError)
    throw new Error(`Не удалось начислить тестовый доход: ${ledgerError.message}`);

  revalidatePath(`/u/${username}`);
  revalidatePath(`/creator/earnings`);
  redirect(`/u/${username}?subscribed=1` as Route);
}
