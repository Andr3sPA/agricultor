export type CatalogProductRecord = {
  id: string;
  name: string;
  category: string;
  availableQuantity: string;
  unit: string;
  priceCOP: number;
  municipality: string;
  isPublished: boolean;
};

export type PublicProduct = Omit<CatalogProductRecord, "isPublished">;

export function getPublicProductOrderHref(productId: string): string {
  return `/catalogo/${encodeURIComponent(productId)}/pedido`;
}

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
        id,
        name,
        category,
        availableQuantity,
        unit,
        priceCOP,
        municipality,
      }) => ({
        id,
        name,
        category,
        availableQuantity,
        unit,
        priceCOP,
        municipality,
      }),
    );
}
