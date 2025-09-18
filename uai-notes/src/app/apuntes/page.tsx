"use client";
import { useSession } from "next-auth/react";
import NoteCard from "@/components/NoteCard";

export default function ApuntesPage() {
  const { data: session } = useSession();

  return (
    <div className="py-4 py-lg-5">
      <div className="container-nv">
        <div className="section-card p-4 p-lg-5 mb-4">
          <div className="d-flex flex-column flex-lg-row align-items-lg-end gap-3">
            <div className="flex-grow-1">
              <h1 className="h3 nv-title mb-2">Apuntes</h1>
              <p className="nv-subtitle mb-0">
                Busca, filtra y explora los apuntes validados por la comunidad UAI.
              </p>
            </div>
            <div className="d-flex gap-2">
              <span className="nv-chip"><i className="bi bi-shield-check" /> Moderados</span>
              <span className="nv-chip"><i className="bi bi-stars" /> Mejor valorados</span>
            </div>
          </div>

          <form className="row g-3 mt-3">
            <div className="col-12 col-md-4">
              <label className="form-label">Asignatura</label>
              <input className="form-control" placeholder="Ej: Cálculo I" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Tema</label>
              <input className="form-control" placeholder="Ej: Integrales" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Palabras clave</label>
              <input className="form-control" placeholder="resumen, guía, control..." />
            </div>
            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-primary btn-pill">
                <i className="bi bi-search me-1" /> Buscar
              </button>
              <button type="reset" className="btn btn-outline-secondary btn-pill">
                Limpiar
              </button>
            </div>
          </form>
        </div>

        {/* Lista placeholder */}
        <div className="row g-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="col-12 col-md-6 col-lg-4" key={i}>
              <NoteCard
                semester={`Semestre ${i % 2 ? "Otoño" : "Primavera"} 2025`}
                downloads={12 + i}
                title={`Título de apunte #${i + 1} — Introducción a integrales impropias`}
                description="Breve descripción del contenido del apunte: definiciones clave, propiedades, ejercicios resueltos y recomendaciones para controles. Incluye fórmulas y tips."
                author={session?.user?.name ?? "Autor"}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
