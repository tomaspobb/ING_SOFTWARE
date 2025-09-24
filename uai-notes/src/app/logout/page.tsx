"use client";
import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    // Salir y volver al home (que redirige a /apuntes o al login)
    signOut({ redirect: true, callbackUrl: "/" });
  }, []);

  return <p className="container-nv py-4">Cerrando sesión…</p>;
}