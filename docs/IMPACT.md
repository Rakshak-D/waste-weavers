# Sustainability impact

Phase 11 uses the existing product-level `ImpactMetric` model and adds a historical `OrderItem.impactSnapshot` for reproducibility.

## Supported metric types

- `TEXTILE_WASTE_DIVERTED` — explicit product-level material representation. Current customer aggregation treats the stored value as per catalogue unit and multiplies it by ordered quantity, preserving the stored unit.
- `REUSE_CYCLES_TARGET` — a product lifecycle target. It is shown on product/catalogue surfaces but is not presented as customer-achieved cycles and is not included in customer totals.

No CO₂, carbon offset, water-saving, landfill, or other scientifically loaded conversion is calculated.

## Aggregation rules

`lib/impact/engine.ts` validates types, numeric values, and units. Aggregation groups by metric type and exact unit; `kg` and `g` remain separate. Only `TEXTILE_WASTE_DIVERTED` is multiplied by line quantity. The same logic is reused for customer impact and order detail presentation.

Customer impact is built from qualifying paid/authorized/not-required orders and the metric snapshot stored on each `OrderItem`. Orders without a snapshot do not contribute a fabricated historical value. Purchases and rentals both contribute product-quantity representation; this does not claim that a rental created a particular number of reuse cycles.

Catalogue impact continues to sum current active-product metrics by metric type and unit. It is labelled as material represented by catalogue records, not total business impact already achieved.

## Admin editing

Admins manage supported metrics from the product edit page. Server validation rejects unsupported types, negative/non-numeric values, empty units, and malformed records. Replacing current product metrics does not rewrite existing order snapshots.

## Limitations

The project does not yet have a scientific lifecycle-assessment methodology, verified measurement audit, external sustainability data source, or rental-cycle attribution model. Demo values remain explicit demo records and should not be presented as independently verified claims.
