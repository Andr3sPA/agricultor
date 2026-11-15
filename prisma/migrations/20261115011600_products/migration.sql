-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "availableQuantity" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "priceCOP" INTEGER NOT NULL,
    "municipality" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_ownerId_updatedAt_idx" ON "Product"("ownerId", "updatedAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
