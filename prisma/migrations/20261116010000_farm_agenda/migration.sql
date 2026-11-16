CREATE TYPE "FarmActivityType" AS ENUM (
  'SOWING',
  'IRRIGATION',
  'FERTILIZATION',
  'HARVEST',
  'OTHER'
);

CREATE TABLE "FarmActivity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "activityType" "FarmActivityType" NOT NULL,
  "scheduledFor" DATE NOT NULL,
  "cropProduct" VARCHAR(100),
  "notes" VARCHAR(1000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FarmActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FarmActivity_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FarmActivity_userId_scheduledFor_idx"
ON "FarmActivity"("userId", "scheduledFor");
