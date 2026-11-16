import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderDecisionForm } from "@/features/orders/order-decision-form";
import type { OrderStatus } from "@/generated/prisma/enums";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
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

    return (
      <li
        className="rounded-2xl border border-slate-200 p-5"
        key={`${producerView ? "producer" : "buyer"}-${order.id}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{order.productName}</h3>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900">
            {statusLabels[order.status]}
          </span>
        </div>
        <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Cantidad</dt>
            <dd>
              {quantityFormatter.format(order.requestedQuantity.toNumber())}{" "}
              {order.unit}
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
            aria-label="Seguimiento del pedido"
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
            <li aria-current="step">
              <p className="font-medium">
                <span
                  aria-hidden="true"
                  className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${order.status === "PENDING" ? "bg-amber-100 text-amber-950" : order.status === "REJECTED" ? "bg-rose-100 text-rose-950" : "bg-emerald-100 text-emerald-950"}`}
                >
                  2
                </span>
                Respuesta del productor
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
                  ? "Agricultor registra la aceptación, pero no gestiona la entrega ni el pago."
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
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <Link
        className="font-semibold text-emerald-900 underline"
        href="/mi-cuenta"
      >
        Volver a mi cuenta
      </Link>
      <section className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Mis pedidos</h1>
      </section>
      {isBuyer && (
        <section className="mt-8 rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Solicitudes que enviaste</h2>
          {buyerOrders.length === 0 ? (
            <p className="mt-4 text-slate-700">Aún no has solicitado productos.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {buyerOrders.map((order) => orderCard(order, false))}
            </ul>
          )}
        </section>
      )}
      {isProducer && (
        <section className="mt-8 rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Solicitudes recibidas</h2>
          {producerOrders.length === 0 ? (
            <p className="mt-4 text-slate-700">Aún no has recibido pedidos.</p>
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
