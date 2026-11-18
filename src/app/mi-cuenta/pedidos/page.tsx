import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderDecisionForm } from "@/features/orders/order-decision-form";
import { PRODUCT_UNITS } from "@/features/products/product-validation";
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

export default async function OrdersPage() {
  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect("/iniciar-sesion");
  }

  const isBuyer = identity.roles.includes("BUYER");
  const isProducer = identity.roles.includes("PRODUCER");
  if (!isBuyer && !isProducer) {
    redirect("/mi-cuenta");
  }

  const [buyerOrders, producerOrders] = await Promise.all([
    isBuyer
      ? prisma.order.findMany({
          where: { buyerId: identity.userId },
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

  function orderCard(
    order: (typeof buyerOrders)[number] | (typeof producerOrders)[number],
    producerView: boolean,
  ) {
    const decisionEvent =
      order.status === "PENDING"
        ? null
        : order.history.find((event) => event.toStatus === order.status);
    const unit =
      PRODUCT_UNITS.find(({ value }) => value === order.unit)?.label ?? order.unit;

    return (
      <li
        className="rounded-2xl border border-slate-200 p-5"
        key={`${producerView ? "producer" : "buyer"}-${order.id}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{order.productName}</h3>
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
            <dd>
              {quantityFormatter.format(order.requestedQuantity.toNumber())}{" "}
              {unit}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Precio por unidad al solicitar</dt>
            <dd>{copFormatter.format(order.priceCOP)}</dd>
          </div>
          <div>
            <dt className="font-medium">Solicitud</dt>
            <dd>{dateFormatter.format(order.createdAt)}</dd>
          </div>
        </dl>
        <section className="mt-4 rounded-xl bg-slate-50 p-4">
          <h4 className="font-medium">Seguimiento</h4>
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
                    ? "Registraste la aceptación. La plataforma no gestiona la entrega ni el pago."
                    : "El productor aceptó esta solicitud. La plataforma no gestiona la entrega ni el pago."
                  : "La solicitud fue rechazada y la cantidad reservada volvió a estar disponible."}
            </p>
          )}
        </section>
        {producerView && order.status === "PENDING" && (
          <OrderDecisionForm orderId={order.id} />
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
          className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
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
            <ul className="mt-5 space-y-4">
              {producerOrders.map((order) => orderCard(order, true))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
