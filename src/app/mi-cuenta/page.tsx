import { redirect } from "next/navigation";
import { RoleForm } from "@/features/auth/role-form";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getCurrentIdentity } from "@/lib/auth/server";
import { canManageProducts } from "@/features/products/product-access";
import { getProducerDashboardSummary } from "@/features/dashboard/producer-dashboard";
import { countFarmActivitiesToday } from "@/features/farm-agenda/farm-agenda-service";
import { prisma } from "@/lib/db";
import Link from "next/link";

const roleLabels = {
  PRODUCER: "Productor o productora",
  BUYER: "Comprador o compradora",
  TRADER: "Comerciante",
  ASSOCIATION: "Asociación o cooperativa",
  ADMIN: "Administrador",
} as const;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const producerIntent = params.intent === "producer";
  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect(
      producerIntent ? "/iniciar-sesion?intent=producer" : "/iniciar-sesion",
    );
  }

  const isProducer = canManageProducts(identity.roles);
  if (producerIntent && isProducer) {
    redirect("/mi-cuenta/productos");
  }
  const [dashboard, todayCount] = isProducer
    ? await Promise.all([
        getProducerDashboardSummary(identity, prisma),
        countFarmActivitiesToday(identity, prisma, new Date()),
      ])
    : [null, 0] as const;

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

            <section
              aria-labelledby="farm-agenda-title"
              className="rounded-2xl border border-slate-200 p-5"
            >
              <h2 className="text-xl font-semibold" id="farm-agenda-title">
                Agenda de labores
              </h2>
              <p className="mt-4 text-slate-700">
                {todayCount === 0
                  ? "No tienes labores anotadas para hoy."
                  : todayCount === 1
                    ? "Tienes 1 labor para hoy."
                    : `Tienes ${todayCount} labores para hoy.`}
              </p>
              <Link
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-900 px-5 py-3 text-center font-semibold text-emerald-950 hover:bg-emerald-50 sm:w-auto"
                href="/mi-cuenta/agenda#farm-activities-title"
              >
                Abrir mi agenda
              </Link>
            </section>

            <section
              aria-labelledby="unit-converter-title"
              className="rounded-2xl border border-slate-200 p-5"
            >
              <h2 className="text-xl font-semibold" id="unit-converter-title">
                Conversor de peso y precio
              </h2>
              <p className="mt-4 text-slate-700">
                Pasa de libras a kilos y calcula el valor de tu cosecha en pesos.
              </p>
              <Link
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-900 px-5 py-3 text-center font-semibold text-emerald-950 hover:bg-emerald-50 sm:w-auto"
                href="/mi-cuenta/conversor"
              >
                Abrir conversor
              </Link>
            </section>
          </div>
          <Link
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-900 sm:w-auto"
            href="/mi-cuenta/calculadora"
          >
            Calcular costos y margen
          </Link>
        </section>
      )}

      {identity.roles.includes("BUYER") && (
        <section
          aria-labelledby="buyer-next-steps-title"
          className={`${dashboard ? "mt-6" : ""} rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8`}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Compras
          </p>
          {dashboard ? (
            <h2
              className="mt-3 text-2xl font-semibold"
              id="buyer-next-steps-title"
            >
              Encuentra productos locales
            </h2>
          ) : (
            <h1
              className="mt-3 text-3xl font-semibold"
              id="buyer-next-steps-title"
            >
              Encuentra productos locales
            </h1>
          )}
          <p className="mt-3 text-slate-700">
            Explora la oferta disponible y vuelve aquí para consultar las
            respuestas a tus solicitudes.
          </p>
          <div className="mt-5 grid gap-3 sm:flex">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-900"
              href="/catalogo"
            >
              Explorar el catálogo
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-900 px-5 py-3 text-center font-semibold text-emerald-950 hover:bg-emerald-50"
              href="/mi-cuenta/pedidos"
            >
              Consultar mis pedidos
            </Link>
          </div>
        </section>
      )}

      <section
        className={`${dashboard || identity.roles.includes("BUYER") ? "mt-6" : ""} rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        {dashboard || identity.roles.includes("BUYER") ? (
          <h2 className="mt-4 text-2xl font-semibold">Tu cuenta</h2>
        ) : (
          <h1 className="mt-4 text-3xl font-semibold">Tu cuenta</h1>
        )}
        <h2 className="mt-8 text-lg font-semibold">Tus perfiles</h2>
        {producerIntent && (
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
            <h3 className="font-semibold text-emerald-950">
              Continúa como productor
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              Agrega este perfil para registrar productos, publicarlos y hacer
              seguimiento de los pedidos que recibas.
            </p>
          </div>
        )}
        <ul className="mt-3 list-inside list-disc space-y-2 text-slate-700">
          {identity.roles.map((role) => (
            <li key={role}>{roleLabels[role]}</li>
          ))}
        </ul>
        <RoleForm initialRole={producerIntent ? "PRODUCER" : undefined} />
        {canManageProducts(identity.roles) && (
          <Link
            className="mt-6 inline-flex rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900"
            href="/mi-cuenta/productos"
          >
            Gestionar mis productos
          </Link>
        )}
        {identity.roles.includes("BUYER") && (
          <Link
            className="mt-6 inline-flex rounded-xl border border-emerald-900 px-5 py-3 font-semibold text-emerald-950 hover:bg-emerald-50"
            href="/mi-cuenta/favoritos"
          >
            Ver mis favoritos
          </Link>
        )}
        <SignOutButton />
      </section>
    </main>
  );
}
