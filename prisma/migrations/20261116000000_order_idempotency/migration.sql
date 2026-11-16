ALTER TABLE "Order"
ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "Order_buyerId_idempotencyKey_key"
ON "Order"("buyerId", "idempotencyKey");
