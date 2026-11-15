import Link from "next/link";
import { getPublicProducts } from "@/features/catalog/public-products";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
} from "@/features/products/product-validation";
import { prisma } from "@/lib/db";

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const quantityFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 3,
});

export const metadata = {
  title: "Catálogo público | Agricultor",
  description: "Productos publicados con cantidad disponible.",
};

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const records = await prisma.product.findMany({
    where: {
      isPublished: true,
      availableQuantity: { gt: 0 },
    },
    select: {
      name: true,
      category: true,
      availableQuantity: true,
      unit: true,
      priceCOP: true,
      municipality: true,
      isPublished: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  const products = getPublicProducts(
    records.map((product) => ({
      ...product,
      availableQuantity: product.availableQuantity.toString(),
    })),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
      <Link className="font-semibold text-emerald-900 underline" href="/">
        Volver al inicio
      </Link>
      <section className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Catálogo público</h1>
        <p className="mt-3 max-w-2xl text-slate-700">
          Consulta productos publicados con cantidad disponible. La información
          de contacto y ubicación precisa de quienes producen no se muestra.
        </p>
      </section>
      {products.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
          No hay productos publicados y disponibles en este momento.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => {
            const category =
              PRODUCT_CATEGORIES.find(({ value }) => value === product.category)
                ?.label ?? product.category;
            const unit =
              PRODUCT_UNITS.find(({ value }) => value === product.unit)?.label ??
              product.unit;

            return (
              <li
                className="rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-sm"
                key={`${product.name}-${product.municipality}-${index}`}
              >
                <h2 className="text-xl font-semibold">{product.name}</h2>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  <div>
                    <dt className="font-medium">Categoría</dt>
                    <dd>{category}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Cantidad disponible</dt>
                    <dd>
                      {quantityFormatter.format(
                        Number(product.availableQuantity),
                      )}{" "}
                      {unit}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Precio por unidad</dt>
                    <dd>{copFormatter.format(product.priceCOP)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Municipio</dt>
                    <dd>{product.municipality}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
