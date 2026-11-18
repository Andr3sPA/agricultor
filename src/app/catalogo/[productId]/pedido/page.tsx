import { randomBytes } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProductOrderHref } from "@/features/catalog/public-products";
import { OrderRequestForm } from "@/features/orders/order-request-form";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
} from "@/features/products/product-validation";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const quantityFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 3,
});

export const dynamic = "force-dynamic";

export default async function RequestOrderPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isPublished: true,
      availableQuantity: { gt: 0 },
    },
    select: {
      id: true,
      ownerId: true,
      name: true,
      category: true,
      availableQuantity: true,
      unit: true,
      priceCOP: true,
      municipality: true,
    },
  });

  if (!product) {
    notFound();
  }

  const identity = await getCurrentIdentity();
  const isBuyer = identity?.roles.includes("BUYER") ?? false;
  const isOwner = identity?.userId === product.ownerId;
  const category =
    PRODUCT_CATEGORIES.find(({ value }) => value === product.category)?.label ??
    product.category;
  const unit =
    PRODUCT_UNITS.find(({ value }) => value === product.unit)?.label ??
    product.unit;
  const availableQuantityLabel = `${quantityFormatter.format(
    product.availableQuantity.toNumber(),
  )} ${unit}`;
  const signInHref = `/iniciar-sesion?redirectTo=${encodeURIComponent(
    getPublicProductOrderHref(product.id),
  )}`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline"
        href="/catalogo"
      >
        Volver al catálogo
      </Link>
      <section className="mt-4 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:mt-6 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Solicitud de compra
        </p>
        <h1 className="mt-4 text-3xl font-semibold wrap-anywhere">
          {product.name}
        </h1>
        <dl className="mt-6 grid gap-4 text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Categoría</dt>
            <dd>{category}</dd>
          </div>
          <div>
            <dt className="font-medium">Disponible</dt>
            <dd>{availableQuantityLabel}</dd>
          </div>
          <div>
            <dt className="font-medium">Precio por unidad</dt>
            <dd>{copFormatter.format(product.priceCOP)}</dd>
          </div>
          <div>
            <dt className="font-medium">Municipio</dt>
            <dd className="wrap-anywhere">{product.municipality}</dd>
          </div>
        </dl>
        {isBuyer && !isOwner ? (
          <OrderRequestForm
            availableQuantityLabel={availableQuantityLabel}
            idempotencyKey={randomBytes(32).toString("base64url")}
            productId={product.id}
          />
        ) : !identity ? (
          <div className="mt-6 space-y-3">
            <p className="text-slate-700">
              Necesitas un perfil de comprador para solicitar este producto.
            </p>
            <Link
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 sm:w-auto"
              href={signInHref}
            >
              Inicia sesión
            </Link>
          </div>
        ) : isOwner ? (
          <p className="mt-6 text-slate-700">
            No puedes solicitar tu propio producto.
          </p>
        ) : (
          <p className="mt-6 text-slate-700">
            Agrega el perfil de comprador a tu cuenta para solicitar este
            producto.
          </p>
        )}
      </section>
    </main>
  );
}
