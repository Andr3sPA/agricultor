"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCatalogPageHref, parseCatalogFilters } from "./public-products";

export function CatalogReturnLink({ className }: { className: string }) {
  const params = useSearchParams();
  const filters = parseCatalogFilters(Object.fromEntries(
    Array.from(params.keys(), (key) => {
      const values = params.getAll(key);
      return [key, values.length === 1 ? values[0] : values];
    }),
  ));

  return (
    <Link className={className} href={getCatalogPageHref(filters, filters.page)}>
      Volver al catálogo
    </Link>
  );
}
