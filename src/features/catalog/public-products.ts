import { PRODUCT_CATEGORIES } from "@/features/products/product-validation";

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

export const PUBLIC_CATALOG_PAGE_SIZE = 12;

export type CatalogFilters = {
  category?: (typeof PRODUCT_CATEGORIES)[number]["value"];
  municipality?: string;
  page: number;
};

type CatalogSearchParams = Record<string, string | string[] | undefined>;

function getSingleSearchParam(
  searchParams: CatalogSearchParams,
  name: string,
): string | undefined {
  const value = searchParams[name];
  return typeof value === "string" ? value : undefined;
}

export function parseCatalogFilters(
  searchParams: CatalogSearchParams,
): CatalogFilters {
  const categoryValue = getSingleSearchParam(searchParams, "categoria");
  const category = PRODUCT_CATEGORIES.find(
    ({ value }) => value === categoryValue,
  )?.value;
  const rawMunicipality = getSingleSearchParam(searchParams, "municipio")?.trim();
  const municipality =
    rawMunicipality && rawMunicipality.length <= 100
      ? rawMunicipality
      : undefined;
  const rawPage = getSingleSearchParam(searchParams, "pagina");
  const requestedPage = rawPage ? Number(rawPage) : 1;
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  return { category, municipality, page };
}

export function getPublicProductWhere(
  filters: Pick<CatalogFilters, "category" | "municipality">,
) {
  return {
    isPublished: true,
    availableQuantity: { gt: 0 },
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.municipality
      ? {
          municipality: {
            equals: filters.municipality,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };
}

export function getCatalogPagination(total: number, requestedPage: number) {
  const pageCount = Math.max(
    1,
    Math.ceil(total / PUBLIC_CATALOG_PAGE_SIZE),
  );
  const page = Math.min(requestedPage, pageCount);

  return {
    page,
    pageCount,
    skip: (page - 1) * PUBLIC_CATALOG_PAGE_SIZE,
    take: PUBLIC_CATALOG_PAGE_SIZE,
  };
}

export function getCatalogPageHref(
  filters: Pick<CatalogFilters, "category" | "municipality">,
  page: number,
): string {
  const searchParams = new URLSearchParams();
  if (filters.category) searchParams.set("categoria", filters.category);
  if (filters.municipality) {
    searchParams.set("municipio", filters.municipality);
  }
  if (page > 1) searchParams.set("pagina", String(page));

  const query = searchParams.toString();
  return query ? `/catalogo?${query}` : "/catalogo";
}

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
