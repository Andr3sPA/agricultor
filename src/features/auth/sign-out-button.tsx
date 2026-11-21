"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  return (
    <div className="text-right">
      <button
        className="min-h-12 rounded-xl bg-emerald-100 px-4 py-3 font-semibold text-emerald-950 hover:bg-emerald-200"
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
        <p className="mt-2 text-sm text-rose-100" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
