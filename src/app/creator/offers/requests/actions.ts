"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionalText, requiredText } from "@/lib/validation";

export async function createCreatorOfferRequest(formData: FormData) {
  const { supabase, user } = await requireUser();
  const offerId = requiredText(formData.get("offer_id"), 100);
  const username = requiredText(formData.get("username"), 100);
  const note = optionalText(formData.get("note"), 1000);
  if (!offerId || !username) throw new Error("Действие недоступно.");

  const { data: offer } = await supabase
    .from("creator_offers")
    .select("id, creator_id, price_minor, currency, is_active")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer?.is_active || offer.creator_id === user.id)
    throw new Error("Это действие сейчас недоступно.");

  const { error } = await supabase.from("creator_offer_requests").insert({
    offer_id: offer.id,
    creator_id: offer.creator_id,
    requester_id: user.id,
    note,
    price_minor: offer.price_minor,
    currency: offer.currency,
  });
  if (error) throw new Error(`Не удалось отправить запрос: ${error.message}`);

  revalidatePath(`/u/${username}`);
  redirect(`/u/${username}?offer_request=sent` as Route);
}

export async function decideCreatorOfferRequest(formData: FormData) {
  const { supabase, user } = await requireUser();
  const requestId = requiredText(formData.get("request_id"), 100);
  const decision = formData.get("decision") === "rejected" ? "rejected" : "accepted";
  if (!requestId) throw new Error("Запрос не найден.");

  const { data: request } = await supabase
    .from("creator_offer_requests")
    .select("id, creator_id, price_minor, currency, status")
    .eq("id", requestId)
    .eq("creator_id", user.id)
    .maybeSingle();
  if (!request || request.status !== "pending")
    throw new Error("Этот запрос уже обработан.");

  const { error } = await supabase
    .from("creator_offer_requests")
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq("id", request.id);
  if (error) throw new Error(`Не удалось обработать запрос: ${error.message}`);

  if (decision === "accepted") {
    const admin = createAdminClient();
    const gross = Number(request.price_minor);
    const fee = Math.round(gross * 0.2);
    await admin.from("creator_ledger_entries").upsert(
      {
        creator_id: request.creator_id,
        source_type: "offer_request",
        source_id: request.id,
        gross_minor: gross,
        platform_fee_minor: fee,
        creator_net_minor: gross - fee,
        currency: request.currency,
        status: "test",
      },
      { onConflict: "source_type,source_id" },
    );
  }

  revalidatePath("/creator/offer-requests");
  revalidatePath("/creator/earnings");
  redirect("/creator/offer-requests" as Route);
}
