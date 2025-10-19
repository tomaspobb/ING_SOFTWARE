// src/components/UploadCTA.tsx
"use client";

import Link from "next/link";

type Props = {
  compact?: boolean;
  className?: string;
};

export default function UploadCTA({ compact = false, className = "" }: Props) {
  if (compact) {
    return (
      <div className={`d-flex align-items-center gap-3 ${className}`}>
        <div
          className="rounded-circle d-inline-flex align-items-center justify-content-center"
          style={{ width: 36, height: 36, background: "rgba(59,130,246,.12)" }}
        >
          <i className="bi bi-cloud-arrow-up-fill" />
        </div>
        <div className="flex-grow-1">
          <div className="fw-semibold">¿Tienes un buen apunte?</div>
          <div className="text-secondary small">Súbelo y ayuda a la comunidad UAI.</div>
        </div>
        <Link href="/apuntes/upload" className="btn btn-primary btn-sm btn-pill">
          Subir
        </Link>
      </div>
    );
  }

  return (
    <aside
      className={[
        "nv-card nv-card--noaccent", // 👈 sin línea superior
        "p-3 p-md-4 shadow-sm w-100", // ancho completo del contenedor
        className,
      ].join(" ")}
    >
      <div className="d-flex align-items-start gap-3">
        <div
          className="rounded-3 d-inline-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 48, height: 48, background: "rgba(59,130,246,.12)" }}
        >
          <i className="bi bi-cloud-arrow-up-fill fs-4" />
        </div>

        <div className="flex-grow-1">
          <h3 className="h6 mb-1">Sube tu apunte</h3>
          <p className="small text-secondary mb-2">
            Comparte tu PDF con título, asignatura, semestre y etiquetas para que otros lo
            encuentren.
          </p>

          <ul className="small text-secondary mb-3 ps-3">
            <li>Formato: PDF (o imagen JPG/PNG opcional)</li>
            <li>
              Asigna <b>asignatura</b>, <b>tema</b>, <b>año/semestre</b> y <b>palabras clave</b>
            </li>
            <li>El archivo se aloja en Blob y la ficha en MongoDB</li>
          </ul>

          <Link href="/apuntes/upload" className="btn btn-primary w-100 btn-pill">
            Comenzar
          </Link>
        </div>
      </div>
    </aside>
  );
}
