-- Initial PostgreSQL schema for Waste Weavers.
-- Generated from the Prisma schema. Apply with `npx prisma migrate dev` or `migrate deploy`.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "OrderType" AS ENUM ('PURCHASE', 'RENTAL', 'MIXED');
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'FULFILLING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED');
CREATE TYPE "OrderItemType" AS ENUM ('PURCHASE', 'RENTAL');
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'RENTED', 'RETURN_PENDING', 'INSPECTION', 'MAINTENANCE', 'DAMAGED', 'RETIRED');
CREATE TYPE "InventoryCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'DAMAGED');
CREATE TYPE "RentalStatus" AS ENUM ('PENDING', 'RESERVED', 'ACTIVE', 'RETURN_PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ReturnStatus" AS ENUM ('EXPECTED', 'RECEIVED', 'INSPECTION_REQUIRED', 'PROCESSED', 'CANCELLED');
CREATE TYPE "ReturnCondition" AS ENUM ('NOT_ASSESSED', 'GOOD', 'NEEDS_MAINTENANCE', 'DAMAGED', 'RETIRED');
CREATE TYPE "MaintenanceType" AS ENUM ('INSPECTION', 'CLEANING', 'REPAIR', 'REFURBISHMENT');
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CustomOrderStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'QUOTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "passwordHash" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

CREATE TABLE "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

CREATE TABLE "Product" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "shortDescription" TEXT,
  "description" TEXT NOT NULL,
  "purchasePrice" DECIMAL(12,2),
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "rentalPricingConfig" JSONB,
  "rentalPricingNotes" TEXT,
  "rentable" BOOLEAN NOT NULL DEFAULT false,
  "purchasable" BOOLEAN NOT NULL DEFAULT false,
  "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "material" TEXT,
  "dimensions" TEXT,
  "weight" DECIMAL(10,3),
  "color" TEXT,
  "categoryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");
CREATE INDEX "Product_status_rentable_purchasable_idx" ON "Product"("status", "rentable", "purchasable");

CREATE TABLE "ProductImage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "altText" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

CREATE TABLE "InventoryUnit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "inventoryCode" TEXT NOT NULL,
  "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
  "condition" "InventoryCondition" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "InventoryUnit_inventoryCode_key" ON "InventoryUnit"("inventoryCode");
CREATE INDEX "InventoryUnit_productId_status_idx" ON "InventoryUnit"("productId", "status");
CREATE INDEX "InventoryUnit_status_condition_idx" ON "InventoryUnit"("status", "condition");

CREATE TABLE "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "type" "OrderType" NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "subtotal" DECIMAL(12,2),
  "discountTotal" DECIMAL(12,2),
  "taxTotal" DECIMAL(12,2),
  "deliveryTotal" DECIMAL(12,2),
  "grandTotal" DECIMAL(12,2),
  "shippingAddressSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");
CREATE INDEX "Order_status_paymentStatus_idx" ON "Order"("status", "paymentStatus");

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "itemType" "OrderItemType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "lineTotal" DECIMAL(12,2) NOT NULL,
  "rentalPricingSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_itemType_idx" ON "OrderItem"("productId", "itemType");

CREATE TABLE "Rental" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT,
  "customerId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "status" "RentalStatus" NOT NULL DEFAULT 'PENDING',
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "pricingSnapshot" JSONB,
  "deliveryScheduledAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "collectionScheduledAt" TIMESTAMP(3),
  "collectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Rental_orderId_createdAt_idx" ON "Rental"("orderId", "createdAt");
CREATE INDEX "Rental_customerId_createdAt_idx" ON "Rental"("customerId", "createdAt");
CREATE INDEX "Rental_status_startAt_endAt_idx" ON "Rental"("status", "startAt", "endAt");
CREATE INDEX "Rental_startAt_endAt_idx" ON "Rental"("startAt", "endAt");

CREATE TABLE "RentalAllocation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rentalId" TEXT NOT NULL,
  "inventoryUnitId" TEXT NOT NULL,
  "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "RentalAllocation_rentalId_inventoryUnitId_key" ON "RentalAllocation"("rentalId", "inventoryUnitId");
CREATE INDEX "RentalAllocation_inventoryUnitId_rentalId_idx" ON "RentalAllocation"("inventoryUnitId", "rentalId");

CREATE TABLE "Address" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "label" TEXT,
  "recipientName" TEXT,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "country" VARCHAR(2) NOT NULL DEFAULT 'IN',
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Address_userId_updatedAt_idx" ON "Address"("userId", "updatedAt");

CREATE TABLE "RentalReturn" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rentalId" TEXT NOT NULL,
  "returnedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "status" "ReturnStatus" NOT NULL DEFAULT 'EXPECTED',
  "condition" "ReturnCondition" NOT NULL DEFAULT 'NOT_ASSESSED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "RentalReturn_rentalId_key" ON "RentalReturn"("rentalId");
CREATE INDEX "RentalReturn_status_receivedAt_idx" ON "RentalReturn"("status", "receivedAt");

CREATE TABLE "MaintenanceRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "inventoryUnitId" TEXT NOT NULL,
  "type" "MaintenanceType" NOT NULL,
  "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
  "description" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cost" DECIMAL(12,2),
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "MaintenanceRecord_inventoryUnitId_createdAt_idx" ON "MaintenanceRecord"("inventoryUnitId", "createdAt");
CREATE INDEX "MaintenanceRecord_status_type_idx" ON "MaintenanceRecord"("status", "type");

CREATE TABLE "CustomOrder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3),
  "guestCount" INTEGER,
  "requirements" TEXT NOT NULL,
  "budget" DECIMAL(12,2),
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "referenceFileUrl" TEXT,
  "status" "CustomOrderStatus" NOT NULL DEFAULT 'REQUESTED',
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "CustomOrder_customerId_createdAt_idx" ON "CustomOrder"("customerId", "createdAt");
CREATE INDEX "CustomOrder_status_eventDate_idx" ON "CustomOrder"("status", "eventDate");

CREATE TABLE "ImpactMetric" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "metricType" TEXT NOT NULL,
  "value" DECIMAL(12,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ImpactMetric_productId_metricType_idx" ON "ImpactMetric"("productId", "metricType");

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryUnit" ADD CONSTRAINT "InventoryUnit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RentalAllocation" ADD CONSTRAINT "RentalAllocation_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentalAllocation" ADD CONSTRAINT "RentalAllocation_inventoryUnitId_fkey" FOREIGN KEY ("inventoryUnitId") REFERENCES "InventoryUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentalReturn" ADD CONSTRAINT "RentalReturn_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_inventoryUnitId_fkey" FOREIGN KEY ("inventoryUnitId") REFERENCES "InventoryUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomOrder" ADD CONSTRAINT "CustomOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImpactMetric" ADD CONSTRAINT "ImpactMetric_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
