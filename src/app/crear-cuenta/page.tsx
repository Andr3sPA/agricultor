import { AuthForm } from "@/features/auth/auth-form";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8 sm:px-6 sm:py-12">
      <section className="w-full rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-10">
        <Link
          className="mb-5 inline-flex min-h-12 items-center font-semibold text-emerald-900 underline underline-offset-4"
          href="/"
        >
          Volver al inicio
        </Link>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Crea tu cuenta</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Tu cuenta empieza como comprador. Luego puedes agregar otros perfiles.
        </p>
        <AuthForm mode="sign-up" />
      </section>
    </main>
  );
}
