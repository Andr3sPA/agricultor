CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

ALTER TABLE "Product"
ADD COLUMN "reservedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
ADD CONSTRAINT "Product_inventory_capacity_check"
CHECK (
    "availableQuantity" >= 0
    AND "reservedQuantity" >= 0
    AND "availableQuantity" + "reservedQuantity" <= 999999999.999
);

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" VARCHAR(100) NOT NULL,
    "requestedQuantity" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "priceCOP" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Order_requestedQuantity_check" CHECK ("requestedQuantity" > 0),
    CONSTRAINT "Order_priceCOP_check" CHECK ("priceCOP" > 0)
);

CREATE TABLE "OrderHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Order_buyerId_createdAt_idx" ON "Order"("buyerId", "createdAt");
CREATE INDEX "Order_producerId_status_createdAt_idx" ON "Order"("producerId", "status", "createdAt");
CREATE INDEX "Order_productId_idx" ON "Order"("productId");
CREATE INDEX "OrderHistory_orderId_createdAt_idx" ON "OrderHistory"("orderId", "createdAt");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "Order_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderHistory"
ADD CONSTRAINT "OrderHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "OrderHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
