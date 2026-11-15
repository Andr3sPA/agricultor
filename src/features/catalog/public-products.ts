export type CatalogProductRecord = {
  name: string;
  category: string;
  availableQuantity: string;
  unit: string;
  priceCOP: number;
  municipality: string;
  isPublished: boolean;
};

export type PublicProduct = Omit<CatalogProductRecord, "isPublished">;

export function getPublicProducts(
  products: readonly CatalogProductRecord[],
): PublicProduct[] {
  return products
    .filter(
      ({ availableQuantity, isPublished }) =>
        isPublished && Number(availableQuantity) > 0,
    )
    .map(
      ({
        name,
        category,
        availableQuantity,
        unit,
        priceCOP,
        municipality,
      }) => ({
        name,
        category,
        availableQuantity,
        unit,
        priceCOP,
        municipality,
      }),
    );
}
