"use client";

export default function CatalogError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <section
        aria-labelledby="catalog-error-title"
        className="rounded-2xl border border-amber-300 bg-white p-5 sm:p-6"
      >
        <h1
          className="text-xl font-semibold text-emerald-950"
          id="catalog-error-title"
        >
          No pudimos cargar el catálogo
        </h1>
        <p className="mt-3 text-slate-700" role="alert">
          Revisa tu conexión e inténtalo de nuevo.
        </p>
        <button
          className="mt-5 min-h-12 w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 sm:w-auto"
          onClick={reset}
          type="button"
        >
          Intentar de nuevo
        </button>
      </section>
    </main>
  );
}
