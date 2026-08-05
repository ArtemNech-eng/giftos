"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { parseAmountToMinor } from "@/lib/money";
import { createSupportCheckout } from "@/lib/services/supports";
import { optionalText, requiredText } from "@/lib/validation";

export async function startFundraiserSupport(formData: FormData) {
  const { supabase, user } = await requireUser();
  const fundraiserId = requiredText(formData.get("fundraiser_id"), 100);
  const amountMinor = parseAmountToMinor(formData.get("amount"));
  const message = optionalText(formData.get("message"), 1000);
  const visibilityValue = formData.get("visibility");
  const visibility =
    visibilityValue === "activity_only" || visibilityValue === "anonymous"
      ? visibilityValue
      : "exact";

  if (!fundraiserId || !amountMinor || amountMinor <= 0) {
    throw new Error("Укажите сумму поддержки больше нуля.");
  }

  const { data: fundraiser } = await supabase
    .from("fundraisers")
    .select("id, title, currency, status, ends_at")
    .eq("id", fundraiserId)
    .maybeSingle();

  if (!fundraiser || fundraiser.status !== "active") {
    throw new Error("Этот сбор сейчас недоступен для поддержки.");
  }
  if (fundraiser.ends_at && new Date(fundraiser.ends_at) <= new Date()) {
    throw new Error("Срок этого сбора уже завершён.");
  }

  const { checkoutUrl } = await createSupportCheckout({
    fundraiserId: fundraiser.id,
    supporterId: user.id,
    amountMinor,
    currency: fundraiser.currency,
    visibility,
    message,
    fundraiserTitle: fundraiser.title,
  });

  // A real provider returns an external checkout URL; Next supports that at runtime.
  redirect(checkoutUrl as Route);
}

export async function postFundraiserComment(formData: FormData) {
  const { supabase, user } = await requireUser();
  const fundraiserId = requiredText(formData.get("fundraiser_id"), 100);
  const fundraiserSlug = requiredText(formData.get("fundraiser_slug"), 100);
  const body = requiredText(formData.get("body"), 2000);

  if (!fundraiserId || !fundraiserSlug || !body) {
    throw new Error("Введите сообщение для обсуждения.");
  }

  const { error } = await supabase.from("fundraiser_comments").insert({
    fundraiser_id: fundraiserId,
    author_id: user.id,
    body,
  });
  if (error) throw new Error(`Не удалось отправить сообщение: ${error.message}`);

  revalidatePath(`/fundraisers/${fundraiserSlug}`);
  redirect(`/fundraisers/${fundraiserSlug}#discussion`);
}
