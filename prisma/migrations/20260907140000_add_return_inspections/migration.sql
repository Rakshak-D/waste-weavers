-- Phase 10: preserve condition outcomes for each physical unit in a multi-unit return.
CREATE TABLE "ReturnInspection" (
    "id" TEXT NOT NULL,
    "rentalReturnId" TEXT NOT NULL,
    "rentalAllocationId" TEXT NOT NULL,
    "condition" "ReturnCondition" NOT NULL DEFAULT 'NOT_ASSESSED',
    "maintenanceType" "MaintenanceType",
    "notes" TEXT,
    "inspectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnInspection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReturnInspection_rentalAllocationId_key" ON "ReturnInspection"("rentalAllocationId");
CREATE INDEX "ReturnInspection_rentalReturnId_condition_idx" ON "ReturnInspection"("rentalReturnId", "condition");
CREATE INDEX "ReturnInspection_condition_inspectedAt_idx" ON "ReturnInspection"("condition", "inspectedAt");

ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_rentalReturnId_fkey" FOREIGN KEY ("rentalReturnId") REFERENCES "RentalReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_rentalAllocationId_fkey" FOREIGN KEY ("rentalAllocationId") REFERENCES "RentalAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
