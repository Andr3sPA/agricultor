import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
} from "@/features/products/product-validation";

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

export type CatalogSort = "precio-asc" | "precio-desc";

export type CatalogFilters = {
  name?: string;
  category?: (typeof PRODUCT_CATEGORIES)[number]["value"];
  municipality?: string;
  sort?: CatalogSort;
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
  const rawName = getSingleSearchParam(searchParams, "producto")?.trim();
  const name =
    rawName && rawName.length <= 100 && !rawName.includes("\0")
      ? rawName
      : undefined;
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
  const rawSort = getSingleSearchParam(searchParams, "orden");
  const sort =
    rawSort === "precio-asc" || rawSort === "precio-desc"
      ? rawSort
      : undefined;

  return { ...(name ? { name } : {}), category, municipality, sort, page };
}

export function getPublicProductWhere(
  filters: Pick<CatalogFilters, "name" | "category" | "municipality">,
) {
  return {
    isPublished: true,
    availableQuantity: { gt: 0 },
    ...(filters.name
      ? {
          name: {
            contains: filters.name.replace(/[\\%_]/g, "\\$&"),
            mode: "insensitive" as const,
          },
        }
      : {}),
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

export function getCatalogOrderBy(sort: CatalogSort | undefined) {
  if (sort === "precio-asc") {
    return [{ priceCOP: "asc" as const }, { id: "asc" as const }];
  }
  if (sort === "precio-desc") {
    return [{ priceCOP: "desc" as const }, { id: "asc" as const }];
  }

  return [{ updatedAt: "desc" as const }, { id: "asc" as const }];
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

function getCatalogQuery(
  filters: Omit<CatalogFilters, "page">,
  page: number,
): string {
  const searchParams = new URLSearchParams();
  if (filters.name) searchParams.set("producto", filters.name);
  if (filters.category) searchParams.set("categoria", filters.category);
  if (filters.municipality) {
    searchParams.set("municipio", filters.municipality);
  }
  if (filters.sort) searchParams.set("orden", filters.sort);
  if (page > 1) searchParams.set("pagina", String(page));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getCatalogPageHref(
  filters: Omit<CatalogFilters, "page">,
  page: number,
): string {
  return `/catalogo${getCatalogQuery(filters, page)}`;
}

export function getPublicProductOrderHref(productId: string): string {
  return `/catalogo/${encodeURIComponent(productId)}/pedido`;
}

export function getPublicProductHref(
  productId: string,
  filters?: CatalogFilters,
): string {
  const path = `/catalogo/${encodeURIComponent(productId)}`;
  return filters
    ? `${path}${getCatalogQuery(filters, filters.page)}`
    : path;
}

export function getPublicProductMetadata(
  product: PublicProduct,
  baseUrl: URL,
) {
  const category =
    PRODUCT_CATEGORIES.find(({ value }) => value === product.category)?.label ??
    product.category;
  const unit =
    PRODUCT_UNITS.find(({ value }) => value === product.unit)?.label ??
    product.unit;
  const quantity = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 3,
  }).format(Number(product.availableQuantity));
  const price = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(product.priceCOP);
  const title = `${product.name} | Agricultor`;
  const description = `${category} · ${quantity} ${unit} disponibles · ${price} por unidad · ${product.municipality}`;
  const url = new URL(getPublicProductHref(product.id), baseUrl);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website" as const,
      title,
      description,
      url,
    },
    twitter: {
      card: "summary" as const,
      title,
      description,
    },
  };
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
