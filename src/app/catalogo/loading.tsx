export default function CatalogLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12"
    >
      <p className="text-sm font-semibold text-emerald-900" role="status">
        Cargando el catálogo...
      </p>
      <div
        aria-hidden="true"
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {[0, 1, 2].map((item) => (
          <div
            className="h-48 rounded-2xl border border-emerald-950/5 bg-emerald-100/60 motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
    </main>
  );
}
