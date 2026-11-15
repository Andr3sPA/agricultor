import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Una plataforma para conectar el campo y el mercado
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          Este espacio está en preparación.
        </p>
        <nav className="mt-8 flex flex-wrap gap-4">
          <Link
            className="rounded-xl border border-emerald-900 px-5 py-3 font-semibold text-emerald-950"
            href="/catalogo"
          >
            Ver catálogo
          </Link>
          <Link
            className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white"
            href="/crear-cuenta"
          >
            Crear cuenta
          </Link>
          <Link
            className="rounded-xl border border-emerald-900 px-5 py-3 font-semibold text-emerald-950"
            href="/iniciar-sesion"
          >
            Iniciar sesión
          </Link>
        </nav>
      </section>
    </main>
  );
}
