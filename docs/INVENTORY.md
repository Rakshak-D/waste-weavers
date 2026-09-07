# Physical inventory

Waste Weavers models rental stock as physical `InventoryUnit` rows below a catalogue `Product`. An inventory code such as `WW-FB-001` identifies one reusable physical item and allows rental allocation history to remain attached to that item.

## Status versus condition

`InventoryStatus` describes operational lifecycle: available, reserved, rented, return-pending, inspection, maintenance, damaged, or retired. `InventoryCondition` describes physical quality: new, good, fair, or damaged. They are deliberately independent.

## Admin operations

Admins can list/filter units, create a unit for a product, and update status or condition through `/api/admin/inventory`. Codes are generated on the server and are never accepted as an authoritative client value. Admin pages may display codes because they are operational identifiers; customer APIs do not expose them.

`lib/admin/transitions.ts` rejects invalid lifecycle transitions. In particular, retired units cannot return to circulation and rented units cannot be manually marked available. A transition to `AVAILABLE` is also rejected when current/future rental allocations make it unsafe.

## Allocation interaction

Phase 5 remains the authority for date-based allocation. A unit being `AVAILABLE` is only a lifecycle eligibility signal; overlapping `RentalAllocation` records can still make it unavailable for a requested period. Admin mutations do not bypass the allocation service or create inventory reservations.

## Phase 10 lifecycle extension

Return receiving, per-unit inspection, maintenance records, and guarded re-entry are implemented through the lifecycle services. Advanced cleaning logistics, damage assessment, charges, notifications, and refurbishment planning remain future work.

## Future extension

Returns, inspection outcomes, cleaning, repair, refurbishment, damage assessment, and controlled re-entry into circulation remain future workflow phases. The transition helper is intentionally conservative so those phases can add explicit operational transitions without weakening rental safety.
