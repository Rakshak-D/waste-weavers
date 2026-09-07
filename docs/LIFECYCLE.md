# Return and circular inventory lifecycle

Phase 10 extends the existing rental lifecycle without replacing the Phase 5 allocation model.

`RentalReturn` remains the rental-level receiving record. Because one rental can contain several physical units with different outcomes, `ReturnInspection` records one result per `RentalAllocation`. It reuses `ReturnCondition` and can reference a `MaintenanceType` when cleaning, repair, or refurbishment is required.

Return receiving and inspection writes are transactional. Each unit receives its own condition/status outcome, maintenance records are created where needed, and the rental becomes `COMPLETED` only after every allocation has an inspection result.

Outcomes are: `GOOD` → `AVAILABLE`; `NEEDS_MAINTENANCE` → `MAINTENANCE`; `DAMAGED` → `DAMAGED`; `RETIRED` → `RETIRED`. A maintenance record follows `PENDING → IN_PROGRESS → COMPLETED`; completion updates the unit atomically and cannot revive a retired unit.

Customers see only aggregate return status and condition for their own rentals. Admins may see physical inventory codes and operate `/admin/returns`, `/admin/maintenance`, and inventory lifecycle history. Logistics, notifications, damage charges, refunds, cancellation, and advanced analytics remain future work.
