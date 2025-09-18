"use client";
import { useSession } from "next-auth/react";
import SignInButton from "./SignInButton";

export default function Hero() {
  const { data: session } = useSession();

  return (
    <header id="inicio" className="py-5 bg-gradient"
      style={{ background: "linear-gradient(135deg,#1a1f2b 0%, #0d6efd 100%)" }}>
      <div className="container text-center">
        <h1 className="display-5 fw-bold text-white">
          Apuntes confiables para Ingeniería UAI
        </h1>
        <p className="lead text-light-50 mt-3">
          Busca, filtra y comparte resúmenes con metadatos. Mejora tu estudio con contenido validado por la comunidad.
        </p>
        <div className="mt-4 d-flex gap-3 justify-content-center">
          <a className="btn btn-lg btn-light" href="#features">Ver funcionalidades</a>
          {session ? (
            <a className="btn btn-lg btn-outline-light" href="#apuntes">Subir apunte</a>
          ) : (
            <SignInButton label="Comenzar con Microsoft" size="lg" />
          )}
        </div>
      </div>
    </header>
  );
}
