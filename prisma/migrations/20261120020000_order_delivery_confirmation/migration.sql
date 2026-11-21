BEGIN;

CREATE TABLE "OrderDeliveryConfirmation" (
    "orderId" TEXT NOT NULL PRIMARY KEY REFERENCES "OrderDeliveryDetails"("orderId") ON DELETE CASCADE ON UPDATE CASCADE,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE FUNCTION "clearOrderDeliveryConfirmation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM "OrderDeliveryConfirmation" WHERE "orderId" = NEW."orderId";
    RETURN NEW;
END;
$$;

CREATE TRIGGER "OrderDeliveryDetails_clearConfirmation"
AFTER UPDATE ON "OrderDeliveryDetails"
FOR EACH ROW
WHEN ((OLD."method", OLD."when", OLD."place", OLD."costCOP") IS DISTINCT FROM
      (NEW."method", NEW."when", NEW."place", NEW."costCOP"))
EXECUTE FUNCTION "clearOrderDeliveryConfirmation"();

COMMIT;
