import Link from "next/link";
import { redirect } from "next/navigation";
import { AgriculturalUnitConverter } from "@/features/unit-converter/agricultural-unit-converter";
import { canManageProducts } from "@/features/products/product-access";
import { getCurrentIdentity } from "@/lib/auth/server";

export default async function UnitConverterPage() {
  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect("/iniciar-sesion");
  }

  if (!canManageProducts(identity.roles)) {
    redirect("/mi-cuenta");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="font-semibold text-emerald-900 underline"
        href="/mi-cuenta"
      >
        Volver a mi cuenta
      </Link>
      <section className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Conversor de unidades agrícolas
        </h1>
        <p className="mt-3 text-slate-700">
          Convierte libras de 500 g a kilos y calcula cuánto vale tu cosecha
          con el precio que tú ingreses. Por ejemplo, 10 libras de papa son
          5 kilos y, a $2.000 por kilo, valen $10.000. También puedes convertir
          medidas de área y volumen.
        </p>
        <AgriculturalUnitConverter />
      </section>
    </main>
  );
}
