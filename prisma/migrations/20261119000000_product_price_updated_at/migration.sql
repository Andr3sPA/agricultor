BEGIN;

ALTER TABLE "Product" ADD COLUMN "priceUpdatedAt" TIMESTAMP(3);

CREATE FUNCTION "recordProductPriceUpdatedAt"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW."priceUpdatedAt" := statement_timestamp() AT TIME ZONE 'UTC';
    ELSIF NEW."priceCOP" IS DISTINCT FROM OLD."priceCOP"
       OR NEW."unit" IS DISTINCT FROM OLD."unit" THEN
        NEW."priceUpdatedAt" := statement_timestamp() AT TIME ZONE 'UTC';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "Product_recordPriceUpdatedAt"
BEFORE INSERT OR UPDATE OF "priceCOP", "unit" ON "Product"
FOR EACH ROW
EXECUTE FUNCTION "recordProductPriceUpdatedAt"();

COMMIT;
