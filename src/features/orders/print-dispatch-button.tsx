"use client";

export function PrintDispatchButton() {
  return (
    <button
      className="min-h-11 rounded-lg bg-emerald-800 px-4 font-semibold text-white hover:bg-emerald-900"
      onClick={() => window.print()}
      type="button"
    >
      Imprimir lista de empaque
    </button>
  );
}
