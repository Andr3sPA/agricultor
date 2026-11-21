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
        className="min-h-12 rounded-md px-3 py-3 font-semibold text-[#253528] underline underline-offset-4 hover:bg-[#edddc2]"
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
