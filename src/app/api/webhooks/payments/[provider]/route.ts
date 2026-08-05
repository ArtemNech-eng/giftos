import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments";
import { finalizeSupport } from "@/lib/services/supports";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: providerName } = await params;
    const provider = getPaymentProvider();

    if (provider.name !== providerName) {
      return NextResponse.json({ error: "Unknown payment provider." }, { status: 404 });
    }

    const event = await provider.verifyWebhook(request);
    const admin = createAdminClient();
    const { data: support, error: findError } = await admin
      .from("fundraiser_supports")
      .select("id")
      .eq("provider", event.provider)
      .eq("provider_payment_id", event.providerPaymentId)
      .maybeSingle();

    if (findError) throw findError;
    if (!support) {
      return NextResponse.json({ error: "Payment was not found." }, { status: 404 });
    }

    await finalizeSupport({
      supportId: support.id,
      status: event.status,
      payload: event.payload,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
