import { LoadingIndicator } from "@/components/loading-indicator";

export default function AccountLoading() {
  return (
    <main aria-busy="true" className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 text-emerald-950">
      <LoadingIndicator label="Cargando tu cuenta…" />
      <div aria-hidden="true" className="mt-5 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((item) => (
          <div key={item} className="h-40 rounded-2xl bg-emerald-100/60 motion-safe:animate-pulse" />
        ))}
      </div>
    </main>
  );
}
