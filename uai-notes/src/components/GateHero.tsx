// src/components/GateHero.tsx
"use client";
import { signIn } from "next-auth/react";

export default function GateHero() {
  return (
    <section className="gate-hero">
      <div className="gate-card">
        <header className="gate-header">
          <h1 className="gate-title">Notivium</h1>
          <p className="gate-sub">Plataforma de apuntes colaborativos UAI</p>
        </header>
        <div className="gate-body">
          <button
            className="ms-btn"
            onClick={() => signIn("azure-ad", { callbackUrl: "/apuntes" })}
          >
            <span className="ms-logo" />
            Continuar con Microsoft
          </button>
        </div>
        <div className="gate-footer text-center py-2 small">
          Solo correos permitidos. Problemas de acceso: <b>Notivium.adm@outlook.com</b>
        </div>
      </div>
    </section>
  );
}
