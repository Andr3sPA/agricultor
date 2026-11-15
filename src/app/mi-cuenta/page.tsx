import { redirect } from "next/navigation";
import { RoleForm } from "@/features/auth/role-form";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getCurrentIdentity } from "@/lib/auth/server";

const roleLabels = {
  PRODUCER: "Productor o productora",
  BUYER: "Comprador o compradora",
  TRADER: "Comerciante",
  ASSOCIATION: "Asociación o cooperativa",
  ADMIN: "Administrador",
} as const;

export default async function AccountPage() {
  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect("/iniciar-sesion");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <section className="rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Tu cuenta</h1>
        <h2 className="mt-8 text-lg font-semibold">Tus perfiles</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-slate-700">
          {identity.roles.map((role) => (
            <li key={role}>{roleLabels[role]}</li>
          ))}
        </ul>
        <RoleForm />
        <SignOutButton />
      </section>
    </main>
  );
}
