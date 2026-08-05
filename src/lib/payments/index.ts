import { StubPaymentProvider } from "@/lib/payments/stub-provider";
import type { PaymentProvider } from "@/lib/payments/types";

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER ?? "stub";

  if (provider === "stub") return new StubPaymentProvider();

  throw new Error(`Unsupported payment provider: ${provider}`);
}

export type {
  CheckoutSession,
  CreateCheckoutInput,
  PaymentProvider,
  PaymentStatus,
  VerifiedPaymentEvent,
} from "@/lib/payments/types";
