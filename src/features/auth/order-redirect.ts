import {
  getPublicProductOrderHref,
  parseCatalogFilters,
} from "@/features/catalog/public-products";

const catalogParams = new Set(["producto", "categoria", "municipio", "orden", "unidad", "cantidad", "pagina"]);

export function getOrderRequestRedirect(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^\/catalogo\/([A-Za-z0-9_-]+)\/pedido(?:\?([^#\r\n]+))?$/.exec(value);
  if (!match) return null;

  const searchParams = new URLSearchParams(match[2]);
  const filters: Record<string, string> = {};
  for (const [key, filter] of searchParams) {
    if (!catalogParams.has(key) || Object.hasOwn(filters, key)) return null;
    filters[key] = filter;
  }
  return getPublicProductOrderHref(match[1], parseCatalogFilters(filters));
}
