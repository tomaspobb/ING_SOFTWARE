// src/app/not-found.tsx
"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <EmptyState
        icon="bi-compass-fill"
        title="Página no encontrada"
        subtitle="La ruta que buscaste no existe o fue movida."
        action={
          <a href="/" className="btn btn-primary btn-lg">
            Ir al inicio
          </a>
        }
      />
      <Footer />
    </>
  );
}
