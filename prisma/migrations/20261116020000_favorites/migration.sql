CREATE TABLE "Favorite" (
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId", "productId"),
  CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId")
    REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Favorite_userId_createdAt_idx"
ON "Favorite"("userId", "createdAt");

CREATE INDEX "Favorite_productId_idx"
ON "Favorite"("productId");
