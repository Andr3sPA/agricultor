import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agricultor | Productos del campo",
  description:
    "Explora productos del campo y crea una cuenta para comprar o vender.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-emerald-50/60">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
        <header className="flex min-h-20 items-center justify-between gap-4">
          <Link
            aria-label="Agricultor, inicio"
            className="text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl"
            href="/"
          >
            Agricultor
          </Link>
        </header>

        <section
          aria-labelledby="welcome-title"
          className="overflow-hidden rounded-3xl bg-emerald-900 px-6 py-10 text-white shadow-sm sm:px-10 sm:py-10 lg:px-14"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-200">
              Del campo, más cerca
            </p>
            <h1
              className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl"
              id="welcome-title"
            >
              Compra productos del campo o vende tu cosecha
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-50 sm:text-xl">
              Explora el catálogo sin registrarte. Con una sola cuenta puedes
              comprar y, si produces, agregar tu perfil de productor más
              adelante.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="getting-started-title"
          className="mt-5 rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="max-w-2xl">
            <h2
              className="text-2xl font-bold text-emerald-950"
              id="getting-started-title"
            >
              Empieza con una sola cuenta
            </h2>
            <p className="mt-2 leading-7 text-slate-700">
              Crea tu cuenta para comprar. Si produces, después puedes agregar
              tu perfil para publicar tu cosecha.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-center font-bold text-white hover:bg-emerald-900"
                href="/crear-cuenta"
              >
                Crear cuenta
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-800 px-5 py-3 text-center font-bold text-emerald-950 hover:bg-emerald-50"
                href="/catalogo"
              >
                Explorar el catálogo
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-slate-700">
          ¿Ya tienes cuenta?{" "}
          <Link
            className="font-semibold text-emerald-950 underline decoration-emerald-700 underline-offset-4"
            href="/iniciar-sesion"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
