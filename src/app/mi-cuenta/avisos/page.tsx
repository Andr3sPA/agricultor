import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export default async function OrderNoticesPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/iniciar-sesion");
  const isBuyer = identity.roles.includes("BUYER");
  const isSeller = identity.roles.includes("PRODUCER");
  if (!isBuyer && !isSeller) redirect("/mi-cuenta");

  const [incoming, replies] = await Promise.all([
    isSeller ? prisma.order.findMany({
      where: { producerId: identity.userId, status: "PENDING" },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 20,
      select: { id: true, productName: true, createdAt: true },
    }) : [],
    isBuyer ? prisma.order.findMany({
      where: { buyerId: identity.userId, status: { in: ["ACCEPTED", "REJECTED"] } },
      orderBy: [{ decidedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      take: 20,
      select: { id: true, productName: true, status: true, decidedAt: true, createdAt: true },
    }) : [],
  ]);
  const notices = [
    ...incoming.map((order) => ({
      id: order.id,
      productName: order.productName,
      title: "Solicitud por responder",
      date: order.createdAt,
      anchor: `recibida-${order.id}`,
    })),
    ...replies.map((order) => ({
      id: order.id,
      productName: order.productName,
      title: order.status === "ACCEPTED" ? "Aceptaron tu solicitud" : "Rechazaron tu solicitud",
      date: order.decidedAt ?? order.createdAt,
      anchor: `solicitud-${order.id}`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime() || a.id.localeCompare(b.id)).slice(0, 20);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-5 px-4 py-8">
      <Link className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline" href="/mi-cuenta">Volver a mi cuenta</Link>
      <h1 className="text-3xl font-semibold">Avisos de pedidos</h1>
      <p>Consulta las respuestas recientes y las solicitudes que todavía debes responder.</p>
      {notices.length === 0 ? (
        <p className="rounded-xl bg-white p-4">Por ahora no tienes avisos de pedidos.</p>
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => (
            <li className="rounded-xl border border-slate-200 bg-white p-4" key={notice.anchor}>
              <h2 className="font-semibold">{notice.title}</h2>
              <p className="mt-1 wrap-anywhere">{notice.productName}</p>
              <time className="block text-sm text-slate-700" dateTime={notice.date.toISOString()}>{dateFormatter.format(notice.date)}</time>
              <Link
                aria-label={`Abrir pedido de ${notice.productName} · ${notice.title}`}
                className="mt-1 inline-flex min-h-11 items-center font-semibold text-emerald-900 underline"
                href={`/mi-cuenta/pedidos#${encodeURIComponent(notice.anchor)}`}
              >
                Abrir pedido
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline" href="/mi-cuenta/pedidos">Ver todos los pedidos</Link>
    </main>
  );
}
