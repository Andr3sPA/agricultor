-- Products remain private unless their owner explicitly publishes them.
ALTER TABLE "Product"
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;
