"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseAmountToMinor } from "@/lib/money";
import { requiredText } from "@/lib/validation";

export async function updateMessageRequestSettings(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = requiredText(formData.get("username"), 100);
  const enabled = formData.get("message_requests_enabled") === "on";
  const price = parseAmountToMinor(formData.get("paid_message_price"));
  if (!username) throw new Error("Профиль не найден.");
  if (enabled && (!price || price <= 0))
    throw new Error("Укажите стоимость запроса на сообщение.");

  const { error } = await supabase
    .from("profiles")
    .update({
      message_requests_enabled: enabled,
      paid_message_price_minor: enabled ? price : null,
    })
    .eq("id", user.id);
  if (error) throw new Error(`Не удалось сохранить настройки: ${error.message}`);

  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}` as Route);
}

export async function createPaidMessageRequest(formData: FormData) {
  const { supabase, user } = await requireUser();
  const creatorId = requiredText(formData.get("creator_id"), 100);
  const username = requiredText(formData.get("username"), 100);
  const body = requiredText(formData.get("body"), 2000);
  if (!creatorId || !username || !body || creatorId === user.id)
    throw new Error("Не удалось отправить запрос.");

  const { data: creator } = await supabase
    .from("profiles")
    .select(
      "id, message_requests_enabled, paid_message_price_minor, profile_visibility",
    )
    .eq("id", creatorId)
    .maybeSingle();
  if (
    !creator?.message_requests_enabled ||
    !creator.paid_message_price_minor ||
    creator.profile_visibility !== "public"
  ) {
    throw new Error("Автор сейчас не принимает платные запросы.");
  }

  const { data: request, error } = await supabase
    .from("paid_message_requests")
    .insert({
      creator_id: creator.id,
      sender_id: user.id,
      body,
      price_minor: creator.paid_message_price_minor,
    })
    .select("id")
    .single();
  if (error || !request)
    throw new Error(
      `Не удалось отправить запрос: ${error?.message ?? "неизвестная ошибка"}`,
    );

  await createAdminClient()
    .from("notifications")
    .insert({
      recipient_id: creator.id,
      actor_id: user.id,
      type: "paid_message_request",
      entity_type: "paid_message_request",
      entity_id: request.id,
      payload: { price_minor: creator.paid_message_price_minor },
    });

  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}?message_request=sent` as Route);
}

export async function decidePaidMessageRequest(formData: FormData) {
  const { supabase, user } = await requireUser();
  const requestId = requiredText(formData.get("request_id"), 100);
  const decision = formData.get("decision") === "rejected" ? "rejected" : "accepted";
  if (!requestId) throw new Error("Запрос не найден.");

  const { data: request } = await supabase
    .from("paid_message_requests")
    .select("id, creator_id, sender_id, price_minor, currency, status")
    .eq("id", requestId)
    .eq("creator_id", user.id)
    .maybeSingle();
  if (!request || request.status !== "pending")
    throw new Error("Этот запрос уже обработан.");

  const { error } = await supabase
    .from("paid_message_requests")
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq("id", request.id);
  if (error) throw new Error(`Не удалось обработать запрос: ${error.message}`);

  if (decision === "accepted") {
    const admin = createAdminClient();
    const fee = Math.round(Number(request.price_minor) * 0.2);
    await admin.from("creator_ledger_entries").upsert(
      {
        creator_id: request.creator_id,
        source_type: "message_request",
        source_id: request.id,
        gross_minor: request.price_minor,
        platform_fee_minor: fee,
        creator_net_minor: Number(request.price_minor) - fee,
        currency: request.currency,
        status: "test",
      },
      { onConflict: "source_type,source_id" },
    );
  }

  await createAdminClient()
    .from("notifications")
    .insert({
      recipient_id: request.sender_id,
      actor_id: user.id,
      type:
        decision === "accepted"
          ? "paid_message_request_accepted"
          : "paid_message_request_rejected",
      entity_type: "paid_message_request",
      entity_id: request.id,
      payload: { price_minor: request.price_minor },
    });

  revalidatePath("/creator/requests");
  revalidatePath("/creator/earnings");
  redirect("/creator/requests" as Route);
}
