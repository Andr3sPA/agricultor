import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-8 sm:px-6 sm:py-12">
      <section
        aria-labelledby="product-not-found-title"
        className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1
          className="mt-4 text-3xl font-semibold text-emerald-950"
          id="product-not-found-title"
        >
          Producto no disponible
        </h1>
        <p className="mt-3 leading-7 text-slate-700">
          Este producto puede haberse agotado o haber sido retirado del
          catálogo.
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900 sm:w-auto"
          href="/catalogo"
        >
          Volver al catálogo
        </Link>
      </section>
    </main>
  );
}
