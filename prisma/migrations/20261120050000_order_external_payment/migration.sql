CREATE TABLE "OrderExternalPayment" (
    "orderId" TEXT NOT NULL PRIMARY KEY REFERENCES "OrderDeliveryConfirmation"("orderId") ON DELETE CASCADE ON UPDATE CASCADE,
    "method" VARCHAR(16) NOT NULL CHECK ("method" IN ('TRANSFER', 'ON_DELIVERY', 'WOMPI')),
    "wompiUrl" VARCHAR(250) UNIQUE,
    CONSTRAINT "OrderExternalPayment_link_check" CHECK (
      ("method" = 'WOMPI' AND "wompiUrl" IS NOT NULL) OR
      ("method" <> 'WOMPI' AND "wompiUrl" IS NULL)
    )
);
