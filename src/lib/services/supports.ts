import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider, type PaymentStatus } from "@/lib/payments";

export type CreateSupportInput = {
  fundraiserId: string;
  supporterId: string;
  amountMinor: number;
  currency: string;
  visibility: "exact" | "activity_only" | "anonymous";
  message: string | null;
  fundraiserTitle: string;
};

export async function createSupportCheckout(input: CreateSupportInput) {
  const admin = createAdminClient();
  const { data: support, error: createError } = await admin
    .from("fundraiser_supports")
    .insert({
      fundraiser_id: input.fundraiserId,
      supporter_id: input.supporterId,
      amount_minor: input.amountMinor,
      currency: input.currency,
      visibility: input.visibility,
      message: input.message,
      status: "created",
    })
    .select("id")
    .single();
  if (createError)
    throw new Error(`Не удалось создать поддержку: ${createError.message}`);

  try {
    const provider = getPaymentProvider();
    const checkout = await provider.createCheckout({
      supportId: support.id,
      amountMinor: input.amountMinor,
      currency: input.currency,
      description: `Поддержка сбора «${input.fundraiserTitle}»`,
    });

    const { error: updateError } = await admin
      .from("fundraiser_supports")
      .update({
        provider: checkout.provider,
        provider_payment_id: checkout.providerPaymentId,
        status: "pending",
      })
      .eq("id", support.id)
      .eq("status", "created");
    if (updateError)
      throw new Error(`Не удалось подготовить оплату: ${updateError.message}`);

    return { supportId: support.id, checkoutUrl: checkout.checkoutUrl };
  } catch (error) {
    await admin
      .from("fundraiser_supports")
      .update({ status: "failed" })
      .eq("id", support.id);
    throw error;
  }
}

export async function finalizeSupport({
  supportId,
  status,
  payload = {},
}: {
  supportId: string;
  status: PaymentStatus;
  payload?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("finalize_fundraiser_support", {
    p_support_id: supportId,
    p_status: status,
    p_provider_payload: payload,
  });

  if (error) throw new Error(`Не удалось завершить поддержку: ${error.message}`);
  return Array.isArray(data) ? data[0] : data;
}
