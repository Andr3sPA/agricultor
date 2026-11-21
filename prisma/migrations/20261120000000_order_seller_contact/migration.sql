CREATE TABLE "OrderSellerContact" (
    "orderId" TEXT NOT NULL,
    "whatsapp" VARCHAR(12) NOT NULL,
    CONSTRAINT "OrderSellerContact_pkey" PRIMARY KEY ("orderId"),
    CONSTRAINT "OrderSellerContact_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderSellerContact_whatsapp_check" CHECK ("whatsapp" ~ '^573[0-9]{9}$')
);
