import { RequestPasswordResetForm } from "@/features/auth/password-reset-forms";

export default function RequestPasswordResetPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Recupera tu contraseña</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Te enviaremos un enlace si encontramos una cuenta con ese correo.
        </p>
        <RequestPasswordResetForm />
      </section>
    </main>
  );
}
