"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    setMessageType("error");

    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
          })
        : await authClient.signIn.email({
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
          });

      if (result.error) {
        setMessage(
          isSignUp
            ? "No pudimos crear la cuenta. Revisa los datos o intenta iniciar sesión."
            : "No pudimos iniciar sesión con esos datos.",
        );
        return;
      }

      if (isSignUp) {
        setMessage(
          "Si el correo está disponible, tu cuenta quedó lista. Inicia sesión para continuar.",
        );
        setMessageType("success");
        return;
      }

      router.push("/mi-cuenta");
      router.refresh();
    } catch {
      setMessage(
        "No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={submit}
      className="mt-8 space-y-5"
      aria-describedby={message ? "auth-message" : undefined}
      aria-busy={pending}
    >
      {isSignUp && (
        <div>
          <label className="block text-sm font-medium" htmlFor="name">
            Nombre
          </label>
          <input
            autoComplete="name"
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3"
            id="name"
            maxLength={100}
            minLength={2}
            name="name"
            required
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          Correo electrónico
        </label>
        <input
          autoCapitalize="none"
          autoComplete="email"
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="password">
          Contraseña
        </label>
        <input
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3"
          id="password"
          maxLength={128}
          minLength={8}
          name="password"
          required
          aria-describedby={isSignUp ? "password-hint" : undefined}
          type="password"
        />
        {isSignUp && (
          <p className="mt-2 text-sm text-slate-600" id="password-hint">
            Usa al menos 8 caracteres.
          </p>
        )}
      </div>
      {message && (
        <p
          className={
            messageType === "success"
              ? "text-sm text-emerald-900"
              : "text-sm text-red-800"
          }
          id="auth-message"
          role={messageType === "success" ? "status" : "alert"}
        >
          {message}
        </p>
      )}
      <button
        className="min-h-12 w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending
          ? "Un momento..."
          : isSignUp
            ? "Crear cuenta"
            : "Iniciar sesión"}
      </button>
      {!isSignUp && (
        <p className="text-center text-sm">
          <Link
            className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline"
            href="/recuperar-contrasena"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      )}
      <p className="text-center text-sm text-slate-700">
        {isSignUp ? "¿Ya tienes cuenta?" : "¿Primera vez por aquí?"}{" "}
        <Link
          className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline"
          href={isSignUp ? "/iniciar-sesion" : "/crear-cuenta"}
        >
          {isSignUp ? "Inicia sesión" : "Crea tu cuenta"}
        </Link>
      </p>
    </form>
  );
}
