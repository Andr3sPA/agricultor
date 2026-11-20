import Link from "next/link";
import { redirect } from "next/navigation";
import { getCatalogPageHref, getPublicProductOrderHref } from "@/features/catalog/public-products";
import { OrderCoordinationSummary } from "@/features/orders/order-coordination-summary";
import { OrderDecisionForm } from "@/features/orders/order-decision-form";
import { PRODUCT_UNITS } from "@/features/products/product-validation";
import {
  calculateUnitPriceTotal,
  formatAgriculturalValue,
} from "@/features/unit-converter/agricultural-units";
import type { OrderStatus } from "@/generated/prisma/enums";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
};
const statusClasses: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-950",
  ACCEPTED: "bg-emerald-100 text-emerald-950",
  REJECTED: "bg-rose-100 text-rose-950",
};
const quantityFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 3,
});
const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect("/iniciar-sesion");
  }

  const isBuyer = identity.roles.includes("BUYER");
  const isProducer = identity.roles.includes("PRODUCER");
  if (!isBuyer && !isProducer) {
    redirect("/mi-cuenta");
  }
  const registeredOrder = (await searchParams).registrada;

  const [buyerOrders, producerOrders] = await Promise.all([
    isBuyer
      ? prisma.order.findMany({
          where: { buyerId: identity.userId },
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              select: { id: true, isPublished: true, availableQuantity: true },
            },
            history: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                fromStatus: true,
                toStatus: true,
                createdAt: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    isProducer
      ? prisma.order.findMany({
          where: { producerId: identity.userId },
          orderBy: { createdAt: "desc" },
          include: {
            history: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                fromStatus: true,
                toStatus: true,
                createdAt: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const pendingProducerOrders = producerOrders.filter(({ status }) => status === "PENDING");
  const answeredProducerOrders = producerOrders.filter(({ status }) => status !== "PENDING");

  function orderCard(
    order: (typeof buyerOrders)[number] | (typeof producerOrders)[number],
    producerView: boolean,
  ) {
    const ProductHeading = producerView ? "h4" : "h3";
    const TrackingHeading = producerView ? "h5" : "h4";
    const decisionEvent =
      order.status === "PENDING"
        ? null
        : order.history.find((event) => event.toStatus === order.status);
    const unit =
      PRODUCT_UNITS.find(({ value }) => value === order.unit)?.label ?? order.unit;
    const quantity = `${quantityFormatter.format(order.requestedQuantity.toNumber())} ${unit}`;
    const unitPrice = copFormatter.format(order.priceCOP);
    const estimatedTotal = calculateUnitPriceTotal(
      order.requestedQuantity.toString(),
      String(order.priceCOP),
    ).value;
    const currentOffer = !producerView && order.status === "ACCEPTED" && "product" in order
      ? order.product
      : null;

    return (
      <li
        className="scroll-mt-4 rounded-2xl border border-slate-200 p-5"
        id={producerView ? undefined : `solicitud-${order.id}`}
        key={`${producerView ? "producer" : "buyer"}-${order.id}`}
        tabIndex={producerView ? undefined : -1}
      >
        {!producerView && registeredOrder === order.id && (
          <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-emerald-950" role="status">
            Tu solicitud está registrada.
          </p>
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <ProductHeading className="text-lg font-semibold">{order.productName}</ProductHeading>
          <span
            aria-label={`Estado del pedido: ${statusLabels[order.status]}`}
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[order.status]}`}
          >
            {statusLabels[order.status]}
          </span>
        </div>
        <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Cantidad</dt>
            <dd>{quantity}</dd>
          </div>
          <div>
            <dt className="font-medium">Precio por unidad al solicitar</dt>
            <dd>{unitPrice}</dd>
          </div>
          {estimatedTotal !== null && (
            <div>
              <dt className="font-medium">Valor estimado al solicitar</dt>
              <dd>$ {formatAgriculturalValue(estimatedTotal)} COP</dd>
            </div>
          )}
          <div>
            <dt className="font-medium">Solicitud</dt>
            <dd>{dateFormatter.format(order.createdAt)}</dd>
          </div>
        </dl>
        <section className="mt-4 rounded-xl bg-slate-50 p-4">
          <TrackingHeading className="font-medium">Seguimiento</TrackingHeading>
          <ol
            aria-label={
              producerView
                ? "Seguimiento de la solicitud recibida"
                : "Seguimiento de tu solicitud"
            }
            className="mt-2 space-y-3 text-sm text-slate-700"
          >
            <li>
              <p className="font-medium">
                <span
                  aria-hidden="true"
                  className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-950"
                >
                  1
                </span>
                Solicitud enviada
              </p>
              <time dateTime={order.createdAt.toISOString()}>
                {dateFormatter.format(order.createdAt)}
              </time>
            </li>
            <li aria-current={order.status === "PENDING" ? "step" : undefined}>
              <p className="font-medium">
                <span
                  aria-hidden="true"
                  className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${order.status === "PENDING" ? "bg-amber-100 text-amber-950" : order.status === "REJECTED" ? "bg-rose-100 text-rose-950" : "bg-emerald-100 text-emerald-950"}`}
                >
                  2
                </span>
                {producerView ? "Tu respuesta" : "Respuesta del productor"}
              </p>
              {order.status === "PENDING" ? (
                <p>Esperando respuesta</p>
              ) : (
                <p>
                  {statusLabels[order.status]}
                  {decisionEvent && (
                    <>
                      {" · "}
                      <time dateTime={decisionEvent.createdAt.toISOString()}>
                        {dateFormatter.format(decisionEvent.createdAt)}
                      </time>
                    </>
                  )}
                </p>
              )}
            </li>
          </ol>
          {order.status === "REJECTED" && !producerView ? (
            <p className="mt-3 text-sm text-slate-700">
              El productor rechazó esta solicitud.{" "}
              <Link
                className="font-semibold text-emerald-900 underline"
                href="/catalogo"
              >
                Explora otros productos.
              </Link>
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-700">
              {order.status === "PENDING"
                ? producerView
                  ? "Revisa la solicitud y elige aceptar o rechazar."
                  : "El productor debe revisar la solicitud."
                : order.status === "ACCEPTED"
                  ? producerView
                    ? "Registraste la aceptación."
                    : "El productor aceptó esta solicitud."
                  : "La solicitud fue rechazada y la cantidad reservada volvió a estar disponible."}
            </p>
          )}
        </section>
        {order.status === "ACCEPTED" && (
          <OrderCoordinationSummary
            summary={[
              `Pedido aceptado en Agricultor · ${order.productName}`,
              `Cantidad: ${quantity}`,
              `Precio por unidad al solicitar: ${unitPrice} COP`,
              ...(estimatedTotal === null
                ? []
                : [`Valor estimado al solicitar: $ ${formatAgriculturalValue(estimatedTotal)} COP`]),
              "¿Acordamos si será envío o recogida, cuándo y dónde?",
            ].join("\n")}
          />
        )}
        {producerView && order.status === "PENDING" && (
          <OrderDecisionForm orderId={order.id} />
        )}
        {!producerView && order.status === "ACCEPTED" && (
          <div className="mt-4">
            {currentOffer?.isPublished && currentOffer.availableQuantity.gt(0) ? (
              <Link
                className="inline-flex min-h-11 items-center rounded-xl border border-emerald-900 px-4 py-2 font-semibold text-emerald-950 hover:bg-emerald-50"
                href={getPublicProductOrderHref(currentOffer.id)}
              >
                Volver a solicitar con el precio actual
              </Link>
            ) : (
              <>
                <p className="text-sm text-slate-700">La oferta original ya no está disponible.</p>
                <Link
                  className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline underline-offset-4"
                  href={getCatalogPageHref({ name: order.productName }, 1)}
                >
                  Buscar el producto en el catálogo
                </Link>
              </>
            )}
          </div>
        )}
      </li>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <nav
        aria-label="Navegación de pedidos"
        className="flex flex-wrap gap-x-5 gap-y-3"
      >
        <Link
          className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline underline-offset-4"
          href="/mi-cuenta"
        >
          Volver a mi cuenta
        </Link>
        {isBuyer && (
          <Link
            className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline underline-offset-4"
            href="/catalogo"
          >
            Explorar catálogo
          </Link>
        )}
        {isProducer && (
          <Link
            className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline underline-offset-4"
            href="/mi-cuenta/productos"
          >
            Gestionar productos
          </Link>
        )}
      </nav>
      <section className="mt-4 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Mis pedidos</h1>
        <p className="mt-3 text-slate-700">
          Consulta el estado y la respuesta a cada solicitud. Las fechas y
          horas se muestran en hora de Colombia.
        </p>
      </section>
      {isBuyer && (
        <section
          aria-labelledby="buyer-orders-title"
          className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
        >
          <h2 className="text-2xl font-semibold" id="buyer-orders-title">
            Solicitudes que enviaste
          </h2>
          {buyerOrders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-5">
              <p className="text-slate-700">
                Aún no has solicitado productos. Explora el catálogo para
                encontrar una oferta y enviar una solicitud.
              </p>
              <Link
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-900 sm:w-auto"
                href="/catalogo"
              >
                Explorar el catálogo
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {buyerOrders.map((order) => orderCard(order, false))}
            </ul>
          )}
        </section>
      )}
      {isProducer && (
        <section
          aria-labelledby="producer-orders-title"
          className="mt-6 scroll-mt-4 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
          id="pedidos-recibidos"
          tabIndex={-1}
        >
          <h2 className="text-2xl font-semibold" id="producer-orders-title">
            Solicitudes recibidas
          </h2>
          {producerOrders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-5">
              <p className="text-slate-700">
                Aún no has recibido pedidos. Revisa tus productos publicados
                para que las personas puedan encontrarlos.
              </p>
              <Link
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-900 px-5 py-3 text-center font-semibold text-emerald-950 hover:bg-emerald-50 sm:w-auto"
                href="/mi-cuenta/productos"
              >
                Gestionar mis productos
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-8">
              <section
                aria-labelledby="pending-producer-orders-title"
                className="scroll-mt-4"
                id="pedidos-por-responder"
                tabIndex={-1}
              >
                <h3 className="text-lg font-semibold" id="pending-producer-orders-title">
                  Por responder
                </h3>
                {pendingProducerOrders.length > 0 ? (
                  <ul className="mt-3 space-y-4">
                    {pendingProducerOrders.map((order) => orderCard(order, true))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-700">
                    No tienes solicitudes por responder.
                  </p>
                )}
              </section>
              {answeredProducerOrders.length > 0 && (
                <section aria-labelledby="answered-producer-orders-title">
                  <h3 className="text-lg font-semibold" id="answered-producer-orders-title">
                    Ya respondidas
                  </h3>
                  <ul className="mt-3 space-y-4">
                    {answeredProducerOrders.map((order) => orderCard(order, true))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
