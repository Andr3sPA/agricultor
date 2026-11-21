import Link from "next/link";
import { redirect } from "next/navigation";
import { getColombianAgendaDate } from "@/features/farm-agenda/farm-agenda-service";
import { dispatchGroupKey, getDispatchDateFilter, groupDispatchOrders } from "@/features/orders/dispatch-report";
import { PrintDispatchButton } from "@/features/orders/print-dispatch-button";
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
  const byOrder = params.vista === "pedidos";
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
  const viewQuery = new URLSearchParams({ desde: from, hasta: through });
  if (!byOrder) viewQuery.set("vista", "pedidos");
  const today = getColombianAgendaDate(new Date());
  const weekStart = new Date(`${today}T00:00:00Z`);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const datePresets = [
    { label: "Hoy", from: today, through: today },
    { label: "Últimos 7 días", from: weekStart.toISOString().slice(0, 10), through: today },
    { label: "Todas las fechas", from: "", through: "" },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-5 px-4 py-8 sm:px-6 print:min-h-0 print:max-w-none print:p-0 print:text-black">
      <Link className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline print:hidden" href="/mi-cuenta/pedidos#pedidos-respondidos">
        Volver a pedidos
      </Link>
      <h1 className="text-3xl font-semibold">Cantidades para despacho</h1>
      <p className="print:hidden">Consulta cuánto reunir de cada producto según los pedidos aceptados. Elige fechas de aceptación en hora de Colombia.</p>
      <Link
        className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline print:hidden"
        href={`/mi-cuenta/pedidos/despacho?${viewQuery}`}
      >
        {byOrder ? "Ver cantidades agrupadas por producto" : "Ver lista de empaque por pedido"}
      </Link>
      <nav aria-label="Períodos de despacho" className="flex flex-wrap gap-2 print:hidden">
        {datePresets.map((preset) => {
          const active = preset.from === from && preset.through === through;
          const search = new URLSearchParams({ desde: preset.from, hasta: preset.through });
          if (byOrder) search.set("vista", "pedidos");
          return (
            <Link
              aria-current={active ? "true" : undefined}
              className={`inline-flex min-h-11 items-center rounded-lg border border-emerald-900 px-3 font-semibold ${active ? "bg-emerald-800 text-white" : "text-emerald-950 hover:bg-emerald-50"}`}
              href={preset.from || byOrder ? `/mi-cuenta/pedidos/despacho?${search}` : "/mi-cuenta/pedidos/despacho"}
              key={preset.label}
            >
              {preset.label}
            </Link>
          );
        })}
      </nav>
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 print:hidden" key={query.toString()} method="get">
        {byOrder && <input name="vista" type="hidden" value="pedidos" />}
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
          <p className="hidden print:block">
            Fechas de aceptación (hora de Colombia) · {from && through
              ? from === through ? from : `Del ${from} al ${through}`
              : from ? `Desde ${from}` : through ? `Hasta ${through}` : "Todas las fechas"}
          </p>
          <p role="status">{orders.length} {orders.length === 1 ? "pedido aceptado" : "pedidos aceptados"}</p>
          <div className="rounded-xl bg-emerald-50 p-4 print:hidden">
            <h2 className="font-semibold">Valor estimado de los pedidos aceptados</h2>
            <p className="mt-1 text-2xl font-semibold text-emerald-950">$ {formatAgriculturalValue(String(totalValue))} COP</p>
            <p className="mt-1 text-sm text-slate-700">Suma de los importes registrados al solicitar cada pedido, redondeados al peso. Los pagos se coordinan por separado.</p>
          </div>
          {byOrder ? (
            <section aria-labelledby="packing-by-order">
              <h2 className="mb-3 text-xl font-semibold" id="packing-by-order">Lista de empaque por pedido</h2>
              <ul className="space-y-3">
                {orders.map((order) => (
                  <li className="rounded-xl border border-slate-200 bg-white p-4 print:break-inside-avoid print:border-black" key={order.id}>
                    <h3 className="break-words font-semibold">
                      <span aria-hidden="true" className="mr-3 hidden size-4 border border-black align-middle print:inline-block" />
                      {order.productName}
                    </h3>
                    <p className="mt-1 text-lg font-semibold">
                      {formatAgriculturalValue(order.requestedQuantity.toFixed())} {PRODUCT_UNITS.find(({ value }) => value === order.unit)?.label ?? order.unit}
                    </p>
                    <p className="break-all text-sm">Referencia del pedido: {order.id}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
          <ul aria-label="Cantidades por producto y unidad" className="space-y-3">
            {totals.map(({ productName, unit, quantity, count }) => (
              <li className="rounded-xl border border-slate-200 bg-white p-4 print:break-inside-avoid print:border-black" key={dispatchGroupKey(productName, unit)}>
                <h2 className="break-words font-semibold">
                  <span aria-hidden="true" className="mr-3 hidden size-4 border border-black align-middle print:inline-block" />
                  {productName}
                </h2>
                <p className="mt-1 text-lg font-semibold text-emerald-950">
                  {formatAgriculturalValue(quantity.toFixed())} {PRODUCT_UNITS.find(({ value }) => value === unit)?.label ?? unit}
                </p>
                <p className="text-sm">{count} {count === 1 ? "pedido" : "pedidos"}</p>
                <details className="mt-2 border-t border-slate-200 print:hidden">
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
          )}
          <div className="flex flex-wrap gap-3 print:hidden">
            <PrintDispatchButton />
            <a className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline" download href={`/mi-cuenta/pedidos/aceptados.csv?${query}`}>
              {byOrder ? "Descargar totales por producto (CSV)" : "Descargar estas cantidades (CSV)"}
            </a>
          </div>
        </>
      )}
    </main>
  );
}
