import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agricultor | Productos del campo",
  description:
    "Explora productos del campo o crea una cuenta para ofrecer tu cosecha.",
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
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 font-semibold text-emerald-950 underline decoration-emerald-700 underline-offset-4 hover:bg-white"
            href="/iniciar-sesion"
          >
            Ya tengo cuenta
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
              Agricultor conecta a quienes producen con quienes buscan
              alimentos frescos. Elige por dónde quieres empezar.
            </p>
          </div>
        </section>

        <section
          aria-label="Elige cómo participar"
          className="mt-5 grid gap-5 md:grid-cols-2 md:gap-6"
        >
          <article className="flex flex-col rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-6">
            <div
              aria-hidden="true"
              className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-950"
            >
              <svg
                fill="none"
                height="30"
                viewBox="0 0 24 24"
                width="30"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L20 8H6"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
                <circle cx="10" cy="20" r="1.3" fill="currentColor" />
                <circle cx="17" cy="20" r="1.3" fill="currentColor" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-emerald-950">
              Quiero comprar
            </h2>
            <p className="mt-2 flex-1 leading-7 text-slate-700">
              Explora el catálogo y consulta los productos publicados por
              productores.
            </p>
            <Link
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-center font-bold text-white hover:bg-emerald-900 sm:w-auto"
              href="/catalogo"
            >
              Explorar el catálogo
            </Link>
          </article>

          <article className="flex flex-col rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-6">
            <div
              aria-hidden="true"
              className="flex size-14 items-center justify-center rounded-2xl bg-lime-100 text-emerald-950"
            >
              <svg
                fill="none"
                height="30"
                viewBox="0 0 24 24"
                width="30"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 4c-8.3 0-13 3.8-13 9a5 5 0 0 0 5 5c5.2 0 8-5.7 8-14Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
                <path
                  d="M4 21c2-5 5-8 10-11"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-emerald-950">
              Quiero vender
            </h2>
            <p className="mt-2 flex-1 leading-7 text-slate-700">
              Crea tu cuenta y agrega el perfil de productor para publicar lo
              que cosechas.
            </p>
            <Link
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-emerald-800 px-5 py-3 text-center font-bold text-emerald-950 hover:bg-emerald-50 sm:w-auto"
              href="/crear-cuenta?intent=producer"
            >
              Crear cuenta para vender
            </Link>
          </article>
        </section>

        <p className="mt-8 text-center text-slate-700">
          ¿Ya tienes cuenta?{" "}
          <Link
            className="font-semibold text-emerald-950 underline decoration-emerald-700 underline-offset-4"
            href="/iniciar-sesion"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
