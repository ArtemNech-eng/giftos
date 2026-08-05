import { timingSafeEqual } from "node:crypto";

import type {
  CheckoutSession,
  CreateCheckoutInput,
  PaymentProvider,
  PaymentStatus,
  VerifiedPaymentEvent,
} from "@/lib/payments/types";

const allowedStatuses = new Set<PaymentStatus>([
  "succeeded",
  "cancelled",
  "refunded",
  "failed",
]);

function hasMatchingSignature(received: string | null, expected: string) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export class StubPaymentProvider implements PaymentProvider {
  readonly name = "stub";

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    return {
      provider: this.name,
      providerPaymentId: `stub_${input.supportId.replaceAll("-", "")}`,
      checkoutUrl: `/payments/stub/${input.supportId}`,
    };
  }

  async verifyWebhook(request: Request): Promise<VerifiedPaymentEvent> {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    const signature = request.headers.get("x-giftos-stub-signature");

    if (!secret || !hasMatchingSignature(signature, secret)) {
      throw new Error("Invalid payment webhook signature.");
    }

    const body = (await request.json()) as {
      payment_id?: unknown;
      status?: unknown;
      payload?: unknown;
    };
    const providerPaymentId =
      typeof body.payment_id === "string" ? body.payment_id : "";
    const status = typeof body.status === "string" ? body.status : "";

    if (!providerPaymentId || !allowedStatuses.has(status as PaymentStatus)) {
      throw new Error("Invalid payment webhook payload.");
    }

    return {
      provider: this.name,
      providerPaymentId,
      status: status as PaymentStatus,
      payload:
        body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
          ? (body.payload as Record<string, unknown>)
          : {},
    };
  }
}
