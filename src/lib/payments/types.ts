export type PaymentStatus = "succeeded" | "cancelled" | "refunded" | "failed";

export type CreateCheckoutInput = {
  supportId: string;
  amountMinor: number;
  currency: string;
  description: string;
};

export type CheckoutSession = {
  provider: string;
  providerPaymentId: string;
  checkoutUrl: string;
};

export type VerifiedPaymentEvent = {
  provider: string;
  providerPaymentId: string;
  status: PaymentStatus;
  payload: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent>;
}
