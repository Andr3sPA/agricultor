import { PRODUCT_UNITS } from "@/features/products/product-validation";
import { getDispatchDateFilter, groupDispatchOrders } from "@/features/orders/dispatch-report";
import { calculateUnitPriceTotal } from "@/features/unit-converter/agricultural-units";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

const privateHeaders = { "Cache-Control": "private, no-store" };
const colombianTime = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

function csvText(text: string) {
  // Quoting alone does not prevent spreadsheet formulas in user-entered names.
  const safe = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return new Response("Inicia sesión para descargar tus pedidos.", { status: 401, headers: privateHeaders });
  }
  if (!identity.roles.includes("PRODUCER")) {
    return new Response("Necesitas un perfil de productor.", { status: 403, headers: privateHeaders });
  }

  const params = new URL(request.url).searchParams;
  const consolidated = params.get("formato") === "consolidado";
  const dates = getDispatchDateFilter(params.get("desde") ?? "", params.get("hasta") ?? "");
  if (!dates) {
    return new Response("Revisa las fechas. «Desde» debe ser anterior o igual a «Hasta».", {
      status: 400,
      headers: { ...privateHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const orders = await prisma.order.findMany({
    where: {
      producerId: identity.userId,
      status: "ACCEPTED",
      ...(Object.keys(dates).length ? { decidedAt: dates } : {}),
    },
    orderBy: [{ decidedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      productName: true,
      requestedQuantity: true,
      unit: true,
      priceCOP: true,
      decidedAt: true,
    },
  });
  const rows = consolidated ? [] : orders.map((order) => {
    const quantity = order.requestedQuantity.toString();
    const unit = PRODUCT_UNITS.find(({ value }) => value === order.unit)?.label ?? order.unit;
    const total = calculateUnitPriceTotal(quantity, String(order.priceCOP)).value ?? "";
    return [
      csvText(order.id),
      csvText(order.productName),
      quantity.replace(".", ","),
      csvText(unit),
      order.priceCOP,
      total,
      csvText(order.decidedAt ? colombianTime.format(order.decidedAt) : ""),
    ].join(";");
  });
  const header = "Referencia;Producto;Cantidad;Unidad;Precio por unidad (COP);Total estimado (COP);Aceptado (hora de Colombia)";
  const consolidatedRows = (consolidated ? groupDispatchOrders(orders) : [])
    .map(({ productName, unit, quantity, count }) => [
      csvText(productName),
      quantity.toString().replace(".", ","),
      csvText(PRODUCT_UNITS.find(({ value }) => value === unit)?.label ?? unit),
      count,
    ].join(";"));
  const content = consolidated
    ? ["Producto;Cantidad total;Unidad;Pedidos aceptados", ...consolidatedRows]
    : [header, ...rows];
  return new Response(`\uFEFF${content.join("\r\n")}\r\n`, {
    headers: {
      ...privateHeaders,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": consolidated
        ? 'attachment; filename="cantidades-para-despacho.csv"'
        : 'attachment; filename="pedidos-aceptados.csv"',
    },
  });
}
