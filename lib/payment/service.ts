import { PaymentStatus } from "@prisma/client";

export type PaymentRequest = {
  amount: number;
  currency: string;
};

export type PaymentResult = {
  success: boolean;
  status: PaymentStatus;
  reference: string | null;
  message: string;
};

export interface PaymentService {
  charge(request: PaymentRequest): Promise<PaymentResult>;
}

/** Development-only payment adapter. Replace this boundary with a provider integration later. */
export class DevelopmentPaymentService implements PaymentService {
  async charge(request: PaymentRequest): Promise<PaymentResult> {
    if (process.env.DEV_PAYMENT_OUTCOME === "failed") {
      return { success: false, status: PaymentStatus.FAILED, reference: null, message: "Development payment was declined." };
    }
    return { success: true, status: PaymentStatus.PAID, reference: `dev_${Date.now()}`, message: `Development payment accepted for ${request.currency} ${request.amount}.` };
  }
}

export function getPaymentService(): PaymentService {
  return new DevelopmentPaymentService();
}

