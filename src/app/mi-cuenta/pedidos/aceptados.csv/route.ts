import { PRODUCT_UNITS } from "@/features/products/product-validation";
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

function parseColombianDay(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const utcMidnight = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(utcMidnight.getTime()) || utcMidnight.toISOString().slice(0, 10) !== value) return null;
  // Bogotá uses UTC−05:00 year-round for the dates of these orders.
  return new Date(utcMidnight.getTime() + 5 * 60 * 60 * 1000);
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
  const from = params.get("desde");
  const through = params.get("hasta");
  const firstDay = parseColombianDay(from);
  const lastDay = parseColombianDay(through);
  if ((from && !firstDay) || (through && !lastDay) || (firstDay && lastDay && firstDay > lastDay)) {
    return new Response("Revisa las fechas. «Desde» debe ser anterior o igual a «Hasta».", {
      status: 400,
      headers: { ...privateHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const nextDay = lastDay ? new Date(lastDay.getTime() + 86_400_000) : undefined;
  const orders = await prisma.order.findMany({
    where: {
      producerId: identity.userId,
      status: "ACCEPTED",
      ...(firstDay || nextDay ? { decidedAt: { gte: firstDay ?? undefined, lt: nextDay } } : {}),
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
  const rows = orders.map((order) => {
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
  return new Response(`\uFEFF${[header, ...rows].join("\r\n")}\r\n`, {
    headers: {
      ...privateHeaders,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pedidos-aceptados.csv"',
    },
  });
}
