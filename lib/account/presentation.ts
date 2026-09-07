import type { OrderStatus, PaymentStatus, RentalStatus, ReturnStatus } from "@prisma/client";

export type StatusTone = "neutral" | "positive" | "warning" | "danger";

export type StatusPresentation = { label: string; tone: StatusTone };

export function presentOrderStatus(status: OrderStatus): StatusPresentation {
  const values: Record<OrderStatus, StatusPresentation> = {
    DRAFT: { label: "Draft", tone: "neutral" }, PENDING: { label: "Processing", tone: "warning" }, CONFIRMED: { label: "Confirmed", tone: "positive" }, FULFILLING: { label: "Preparing", tone: "warning" }, COMPLETED: { label: "Completed", tone: "positive" }, CANCELLED: { label: "Cancelled", tone: "danger" },
  };
  return values[status];
}

export function presentPaymentStatus(status: PaymentStatus): StatusPresentation {
  const values: Record<PaymentStatus, StatusPresentation> = {
    NOT_REQUIRED: { label: "Not required", tone: "neutral" }, PENDING: { label: "Payment pending", tone: "warning" }, AUTHORIZED: { label: "Authorized", tone: "positive" }, PAID: { label: "Paid", tone: "positive" }, FAILED: { label: "Payment failed", tone: "danger" }, PARTIALLY_REFUNDED: { label: "Partially refunded", tone: "warning" }, REFUNDED: { label: "Refunded", tone: "neutral" },
  };
  return values[status];
}

export function presentRentalStatus(status: RentalStatus): StatusPresentation {
  const values: Record<RentalStatus, StatusPresentation> = {
    PENDING: { label: "Pending", tone: "warning" }, RESERVED: { label: "Confirmed", tone: "positive" }, ACTIVE: { label: "Active", tone: "positive" }, RETURN_PENDING: { label: "Return pending", tone: "warning" }, COMPLETED: { label: "Completed", tone: "positive" }, CANCELLED: { label: "Cancelled", tone: "danger" },
  };
  return values[status];
}

export function presentReturnStatus(status: ReturnStatus): StatusPresentation {
  const values: Record<ReturnStatus, StatusPresentation> = {
    EXPECTED: { label: "Return expected", tone: "warning" }, RECEIVED: { label: "Received", tone: "positive" }, INSPECTION_REQUIRED: { label: "Inspection required", tone: "warning" }, PROCESSED: { label: "Processed", tone: "positive" }, CANCELLED: { label: "Cancelled", tone: "danger" },
  };
  return values[status];
}

export type RentalGroup = "upcoming" | "active" | "completed" | "cancelled";

export function rentalGroup(status: RentalStatus): RentalGroup {
  if (status === "PENDING" || status === "RESERVED") return "upcoming";
  if (status === "ACTIVE" || status === "RETURN_PENDING") return "active";
  if (status === "COMPLETED") return "completed";
  return "cancelled";
}

