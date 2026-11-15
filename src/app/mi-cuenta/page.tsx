import { redirect } from "next/navigation";
import { RoleForm } from "@/features/auth/role-form";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getCurrentIdentity } from "@/lib/auth/server";
import { canManageProducts } from "@/features/products/product-access";
import { getProducerDashboardSummary } from "@/features/dashboard/producer-dashboard";
import { prisma } from "@/lib/db";
import Link from "next/link";

const roleLabels = {
  PRODUCER: "Productor o productora",
  BUYER: "Comprador o compradora",
  TRADER: "Comerciante",
  ASSOCIATION: "Asociación o cooperativa",
  ADMIN: "Administrador",
} as const;

export default async function AccountPage() {
  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect("/iniciar-sesion");
  }

  const isProducer = canManageProducts(identity.roles);
  const dashboard = isProducer
    ? await getProducerDashboardSummary(identity, prisma)
    : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {dashboard && (
        <section
          aria-labelledby="producer-dashboard-title"
          className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Agricultor
          </p>
          <h1
            className="mt-3 text-3xl font-semibold"
            id="producer-dashboard-title"
          >
            Panel del productor
          </h1>
          <p className="mt-3 text-slate-700">
            Revisa el estado de tus productos y pedidos.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <section
              aria-labelledby="product-summary-title"
              className="rounded-2xl border border-slate-200 p-5"
            >
              <h2 className="text-xl font-semibold" id="product-summary-title">
                Productos
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <dt className="text-sm font-medium text-emerald-950">
                    Publicados
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-emerald-950">
                    {dashboard.products.published}
                  </dd>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <dt className="text-sm font-medium text-amber-950">
                    Agotados
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-amber-950">
                    {dashboard.products.soldOut}
                  </dd>
                </div>
              </dl>
              {dashboard.hasProducts ? (
                <p className="mt-4 text-sm text-slate-700">
                  Tienes {dashboard.products.total}{" "}
                  {dashboard.products.total === 1
                    ? "producto registrado"
                    : "productos registrados"}
                  .
                </p>
              ) : (
                <p className="mt-4 text-sm text-slate-700">
                  Aún no tienes productos. Registra el primero para organizar y
                  publicar tu oferta.
                </p>
              )}
              <Link
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-900 sm:w-auto"
                href="/mi-cuenta/productos"
              >
                Gestionar mis productos
              </Link>
            </section>

            <section
              aria-labelledby="order-summary-title"
              className="rounded-2xl border border-slate-200 p-5"
            >
              <h2 className="text-xl font-semibold" id="order-summary-title">
                Pedidos recibidos
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-amber-50 p-4">
                  <dt className="font-medium text-amber-950">Pendientes</dt>
                  <dd className="text-2xl font-semibold text-amber-950">
                    {dashboard.orders.PENDING}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-emerald-50 p-4">
                  <dt className="font-medium text-emerald-950">Aceptados</dt>
                  <dd className="text-2xl font-semibold text-emerald-950">
                    {dashboard.orders.ACCEPTED}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-rose-50 p-4">
                  <dt className="font-medium text-rose-950">Rechazados</dt>
                  <dd className="text-2xl font-semibold text-rose-950">
                    {dashboard.orders.REJECTED}
                  </dd>
                </div>
              </dl>
              {dashboard.hasOrders ? (
                <p className="mt-4 text-sm text-slate-700">
                  Consulta tus solicitudes recibidas y gestiona las pendientes.
                </p>
              ) : (
                <p className="mt-4 text-sm text-slate-700">
                  Aún no has recibido pedidos. Al recibir una solicitud,
                  aparecerá aquí para que puedas gestionarla.
                </p>
              )}
              <Link
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-900 px-5 py-3 text-center font-semibold text-emerald-950 hover:bg-emerald-50 sm:w-auto"
                href="/mi-cuenta/pedidos"
              >
                Gestionar mis pedidos
              </Link>
            </section>
          </div>
        </section>
      )}

      <section
        className={`${dashboard ? "mt-6" : ""} rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        {dashboard ? (
          <h2 className="mt-4 text-2xl font-semibold">Tu cuenta</h2>
        ) : (
          <h1 className="mt-4 text-3xl font-semibold">Tu cuenta</h1>
        )}
        <h2 className="mt-8 text-lg font-semibold">Tus perfiles</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-slate-700">
          {identity.roles.map((role) => (
            <li key={role}>{roleLabels[role]}</li>
          ))}
        </ul>
        <RoleForm />
        {canManageProducts(identity.roles) && (
          <Link
            className="mt-6 inline-flex rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900"
            href="/mi-cuenta/productos"
          >
            Gestionar mis productos
          </Link>
        )}
        {(identity.roles.includes("BUYER") ||
          identity.roles.includes("PRODUCER")) && (
          <Link
            className="mt-6 inline-flex rounded-xl border border-emerald-900 px-5 py-3 font-semibold text-emerald-950 hover:bg-emerald-50"
            href="/mi-cuenta/pedidos"
          >
            Ver mis pedidos
          </Link>
        )}
        <SignOutButton />
      </section>
    </main>
  );
}
