CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(600) NOT NULL,
    "municipality" VARCHAR(100) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false
);
