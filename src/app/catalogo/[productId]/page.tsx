import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ShareProductButton } from "@/features/catalog/share-product-button";
import {
  getPublicProductHref,
  getPublicProductMetadata,
  getPublicProductOrderHref,
  getPublicProducts,
} from "@/features/catalog/public-products";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
} from "@/features/products/product-validation";
import { prisma } from "@/lib/db";

const metadataBase = new URL(
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
);

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const quantityFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 3,
});

export const dynamic = "force-dynamic";

const getPublicProduct = cache(async (productId: string) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isPublished: true,
      availableQuantity: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      category: true,
      availableQuantity: true,
      unit: true,
      priceCOP: true,
      municipality: true,
    },
  });

  if (!product) {
    return null;
  }

  return (
    getPublicProducts([
      {
        ...product,
        availableQuantity: product.availableQuantity.toString(),
        isPublished: true,
      },
    ])[0] ?? null
  );
});

type PublicProductPageProps = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({
  params,
}: PublicProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicProduct(productId);

  if (!product) {
    return {
      title: "Producto no disponible | Agricultor",
      robots: { index: false, follow: false },
    };
  }

  return {
    metadataBase,
    ...getPublicProductMetadata(product, metadataBase),
  };
}

export default async function PublicProductPage({
  params,
}: PublicProductPageProps) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);

  if (!product) {
    notFound();
  }

  const category =
    PRODUCT_CATEGORIES.find(({ value }) => value === product.category)?.label ??
    product.category;
  const unit =
    PRODUCT_UNITS.find(({ value }) => value === product.unit)?.label ??
    product.unit;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline"
        href="/catalogo"
      >
        Volver al catálogo
      </Link>
      <article className="mt-4 rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:mt-6 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Producto publicado
        </p>
        <h1 className="mt-4 text-3xl font-semibold">{product.name}</h1>
        <dl className="mt-6 grid gap-4 text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Categoría</dt>
            <dd>{category}</dd>
          </div>
          <div>
            <dt className="font-medium">Cantidad disponible</dt>
            <dd>
              {quantityFormatter.format(Number(product.availableQuantity))}{" "}
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
        <ShareProductButton
          href={new URL(
            getPublicProductHref(product.id),
            metadataBase,
          ).toString()}
          productName={product.name}
        />
        <Link
          aria-label={`Solicitar este producto: ${product.name}`}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-800 px-4 py-2 text-center font-semibold text-white underline-offset-4 hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900 sm:w-auto"
          href={getPublicProductOrderHref(product.id)}
        >
          Solicitar este producto
        </Link>
      </article>
    </main>
  );
}
