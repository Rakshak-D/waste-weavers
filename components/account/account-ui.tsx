import Link from "next/link";
import type { ReactNode } from "react";
import type { OrderStatus, PaymentStatus, RentalStatus, ReturnStatus } from "@prisma/client";

import { presentOrderStatus, presentPaymentStatus, presentRentalStatus, presentReturnStatus, type StatusPresentation } from "@/lib/account/presentation";

export function StatusBadge({ status, kind }: { status: OrderStatus | PaymentStatus | RentalStatus | ReturnStatus; kind: "order" | "payment" | "rental" | "return" }) {
  const presentation: StatusPresentation = kind === "order" ? presentOrderStatus(status as OrderStatus) : kind === "payment" ? presentPaymentStatus(status as PaymentStatus) : kind === "rental" ? presentRentalStatus(status as RentalStatus) : presentReturnStatus(status as ReturnStatus);
  const tones = { neutral: "border-[#cdbb9f] bg-[#f7f2e9] text-[#68584a]", positive: "border-[#9cb39b] bg-[#edf4ea] text-[#355636]", warning: "border-[#d1b47e] bg-[#fbf1dc] text-[#76521f]", danger: "border-[#d4a29b] bg-[#f9eae6] text-[#7c332a]" };
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-medium ${tones[presentation.tone]}`}>{presentation.label}</span>;
}

export function AccountNav() {
  return <nav className="flex flex-wrap gap-x-5 gap-y-2 border-b border-[#dfd2be] pb-4 text-sm" aria-label="Account navigation"><Link className="nav-link" href="/account">Overview</Link><Link className="nav-link" href="/account/orders">Orders</Link><Link className="nav-link" href="/account/rentals">Rentals</Link><Link className="nav-link" href="/account/impact">Impact</Link><Link className="nav-link" href="/account/custom-orders">Custom requests</Link><Link className="nav-link" href="/account/addresses">Addresses</Link><Link className="nav-link" href="/account/profile">Profile</Link></nav>;
}

export function AccountFrame({ children, title, intro }: { children: ReactNode; title: string; intro?: string }) {
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"><AccountNav /><div className="mt-10"><p className="eyebrow">Customer account</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.035em]">{title}</h1>{intro && <p className="mt-4 max-w-2xl leading-7 text-[#68584a]">{intro}</p>}{children}</div></main>;
}

type TimelineRental = { status: RentalStatus; createdAt: Date; deliveredAt: Date | null; collectedAt: Date | null; return?: { status: ReturnStatus; condition?: string } | null };

export function RentalTimeline({ rental }: { rental: TimelineRental }) {
  const steps: { label: string; visible: boolean; detail: string }[] = [
    { label: "Order confirmed", visible: true, detail: formatTimelineDate(rental.createdAt) },
    { label: "Rental confirmed", visible: rental.status !== "PENDING", detail: rental.status === "PENDING" ? "Not yet updated" : "Booking recorded" },
    { label: "Delivered", visible: Boolean(rental.deliveredAt), detail: rental.deliveredAt ? formatTimelineDate(rental.deliveredAt) : "Not yet updated" },
    { label: "Rental active", visible: rental.status === "ACTIVE" || rental.status === "RETURN_PENDING" || rental.status === "COMPLETED", detail: rental.status === "ACTIVE" ? "Currently active" : rental.status === "PENDING" || rental.status === "RESERVED" ? "Not yet updated" : "Recorded" },
    { label: "Return", visible: Boolean(rental.collectedAt) || rental.status === "RETURN_PENDING" || rental.status === "COMPLETED" || Boolean(rental.return), detail: rental.collectedAt ? formatTimelineDate(rental.collectedAt) : rental.return ? presentReturnStatus(rental.return.status).label : rental.status === "RETURN_PENDING" ? "Return pending" : "Not yet updated" },
    { label: "Inspection / maintenance", visible: Boolean(rental.return && ["INSPECTION_REQUIRED", "PROCESSED"].includes(rental.return.status)), detail: rental.return?.condition === "NEEDS_MAINTENANCE" ? "Maintenance required" : rental.return?.condition === "GOOD" ? "Condition recorded" : rental.return ? presentReturnStatus(rental.return.status).label : "Not yet updated" },
    { label: "Completed", visible: rental.status === "COMPLETED", detail: rental.status === "COMPLETED" ? "Lifecycle marked complete" : "Not yet updated" },
  ];
  return <ol className="mt-6 border-l border-[#cdbb9f] pl-6">{steps.filter((step) => step.visible).map((step, index) => <li key={step.label} className="relative pb-7 last:pb-0"><span className="absolute -left-[31px] top-0 h-3 w-3 rounded-full border-2 border-[#f7f2e9] bg-[#6b4b30]" /><p className="font-medium text-[#5e4b3a]">{step.label}</p><p className="mt-1 text-sm text-[#665548]">{step.detail}</p>{index === steps.filter((item) => item.visible).length - 1 && <p className="mt-2 text-xs text-[#665548]">Current status: <StatusBadge status={rental.status} kind="rental" /></p>}</li>)}</ol>;
}

export function formatTimelineDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
