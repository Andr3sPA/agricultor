"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  return (
    <div className="mt-8">
      <button
        className="rounded-xl px-5 py-3 font-semibold text-emerald-950 underline"
        onClick={async () => {
          setMessage("");
          try {
            const result = await authClient.signOut();
            if (result.error) {
              setMessage("No pudimos cerrar la sesión. Inténtalo de nuevo.");
              return;
            }
            router.push("/");
            router.refresh();
          } catch {
            setMessage("No pudimos conectarnos. Inténtalo de nuevo.");
          }
        }}
        type="button"
      >
        Cerrar sesión
      </button>
      {message && (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
