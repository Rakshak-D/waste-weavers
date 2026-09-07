-- Phase 11: preserve the product impact record used when an order was created.
ALTER TABLE "OrderItem" ADD COLUMN "impactSnapshot" JSONB;
