import Link from "next/link";
import { redirect } from "next/navigation";
import { dispatchGroupKey, getDispatchDateFilter, groupDispatchOrders } from "@/features/orders/dispatch-report";
import { PRODUCT_UNITS } from "@/features/products/product-validation";
import { calculateUnitPriceTotal, formatAgriculturalValue } from "@/features/unit-converter/agricultural-units";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/iniciar-sesion");
  if (!identity.roles.includes("PRODUCER")) redirect("/mi-cuenta/pedidos");

  const params = await searchParams;
  const from = typeof params.desde === "string" ? params.desde : "";
  const through = typeof params.hasta === "string" ? params.hasta : "";
  const dates = getDispatchDateFilter(from, through);
  const orders = dates ? await prisma.order.findMany({
    where: {
      producerId: identity.userId,
      status: "ACCEPTED",
      ...(Object.keys(dates).length ? { decidedAt: dates } : {}),
    },
    orderBy: [{ decidedAt: "desc" }, { id: "asc" }],
    select: { id: true, productName: true, unit: true, requestedQuantity: true, priceCOP: true },
  }) : [];
  const totals = groupDispatchOrders(orders);
  const ordersByGroup = new Map<string, { order: (typeof orders)[number]; value: bigint }[]>();
  let totalValue = BigInt(0);
  for (const order of orders) {
    const key = dispatchGroupKey(order.productName, order.unit);
    const value = BigInt(calculateUnitPriceTotal(order.requestedQuantity.toFixed(), String(order.priceCOP)).value ?? "0");
    totalValue += value;
    const group = ordersByGroup.get(key);
    if (group) group.push({ order, value });
    else ordersByGroup.set(key, [{ order, value }]);
  }
  const query = new URLSearchParams({ formato: "consolidado", desde: from, hasta: through });

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-5 px-4 py-8 sm:px-6">
      <Link className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline" href="/mi-cuenta/pedidos#pedidos-respondidos">
        Volver a pedidos
      </Link>
      <h1 className="text-3xl font-semibold">Cantidades para despacho</h1>
      <p>Consulta cuánto reunir de cada producto según los pedidos aceptados. Elige fechas de aceptación en hora de Colombia.</p>
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4" method="get">
        <label className="text-sm font-medium">Desde
          <input className="mt-1 block min-h-11 rounded-lg border border-slate-300 px-3" defaultValue={from} name="desde" type="date" />
        </label>
        <label className="text-sm font-medium">Hasta
          <input className="mt-1 block min-h-11 rounded-lg border border-slate-300 px-3" defaultValue={through} name="hasta" type="date" />
        </label>
        <button className="min-h-11 rounded-lg bg-emerald-800 px-4 font-semibold text-white" type="submit">Consultar</button>
      </form>
      {!dates ? (
        <p className="text-rose-800" role="alert">Revisa las fechas. «Desde» debe ser anterior o igual a «Hasta».</p>
      ) : totals.length === 0 ? (
        <p>No hay pedidos aceptados para estas fechas.</p>
      ) : (
        <>
          <p role="status">{orders.length} {orders.length === 1 ? "pedido aceptado" : "pedidos aceptados"}</p>
          <div className="rounded-xl bg-emerald-50 p-4">
            <h2 className="font-semibold">Valor estimado de los pedidos aceptados</h2>
            <p className="mt-1 text-2xl font-semibold text-emerald-950">$ {formatAgriculturalValue(String(totalValue))} COP</p>
            <p className="mt-1 text-sm text-slate-700">Suma de los importes registrados al solicitar cada pedido, redondeados al peso. Los pagos se coordinan por separado.</p>
          </div>
          <ul aria-label="Cantidades por producto y unidad" className="space-y-3">
            {totals.map(({ productName, unit, quantity, count }) => (
              <li className="rounded-xl border border-slate-200 bg-white p-4" key={dispatchGroupKey(productName, unit)}>
                <h2 className="break-words font-semibold">{productName}</h2>
                <p className="mt-1 text-lg font-semibold text-emerald-950">
                  {formatAgriculturalValue(quantity.toFixed())} {PRODUCT_UNITS.find(({ value }) => value === unit)?.label ?? unit}
                </p>
                <p className="text-sm">{count} {count === 1 ? "pedido" : "pedidos"}</p>
                <details className="mt-2 border-t border-slate-200">
                  <summary className="min-h-11 cursor-pointer pt-3 font-semibold text-emerald-900">
                    Ver pedidos de este total
                  </summary>
                  <ul className="divide-y divide-slate-200">
                    {ordersByGroup.get(dispatchGroupKey(productName, unit))?.map(({ order, value }) => (
                      <li className="py-2" key={order.id}>
                        <p>Cantidad del pedido: {formatAgriculturalValue(order.requestedQuantity.toFixed())}</p>
                        <p className="text-sm">Valor estimado: $ {formatAgriculturalValue(String(value))} COP</p>
                        <Link
                          className="inline-flex min-h-11 items-center break-all text-sm font-semibold text-emerald-900 underline"
                          href={`/mi-cuenta/pedidos?${new URLSearchParams({ respuesta: "ACCEPTED", producto: order.id })}#pedidos-respondidos`}
                        >
                          Abrir pedido {order.id}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
          <a className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline" download href={`/mi-cuenta/pedidos/aceptados.csv?${query}`}>
            Descargar estas cantidades (CSV)
          </a>
        </>
      )}
    </main>
  );
}
