# Custom event orders

Phase 12 treats `CustomOrder` as a customer request/lead, not a commercial `Order`. Submission does not reserve inventory, create a product, create an invoice, collect payment, or confirm production.

## Customer workflow

Authenticated customers use `/custom-order` to submit event type, optional future event date, optional guest count, requirements, working budget, and an optional HTTPS/local reference path. The request is stored with `CustomOrderStatus.REQUESTED` assigned by the server. Customers can view their own history at `/account/custom-orders` and details at `/account/custom-orders/[id]`.

Customer reads always include `customerId` from the authenticated session. Internal `adminNotes` are deliberately excluded from customer queries and pages.

## Admin workflow

Admins use `/admin/custom-orders` for bounded search/status filtering and `/admin/custom-orders/[id]` for detail review, internal notes, and workflow status changes. Admin services call `requireAdmin()` themselves; route placement and hidden links are not treated as authorization.

The existing status lifecycle is centralized in `lib/admin/transitions.ts`: `REQUESTED → UNDER_REVIEW → QUOTED/APPROVED → IN_PROGRESS → COMPLETED`, with cancellation permitted only before final completion where the current enum allows it. Invalid backwards jumps are rejected.

## Validation and references

Event dates use the existing date-only parser and cannot be in the past. Guest counts and budgets have bounded server-side validation. No file upload provider was added; references are limited to HTTPS URLs or local paths, and arbitrary uploaded content is not stored.

## Limitations

There is no quotation engine, customer-facing response field, invoice, payment, production schedule, delivery integration, CRM, notification, refund, or cancellation workflow. The existing `adminNotes` field is internal only. A later commercial agreement may create a normal `Order` through a separate flow.
