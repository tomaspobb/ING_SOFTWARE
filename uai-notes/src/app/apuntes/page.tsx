"use client";

import { useEffect, useState } from "react";
import { SUBJECTS } from "@/lib/subjects";
import UploadCTA from "@/components/UploadCTA";

type Note = {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  keywords?: string[];
  authorName?: string;
  pdfUrl?: string;
  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
};

export default function ApuntesRepositoryPage() {
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // filtros
  const [subject, setSubject] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");
  const [year, setYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (topic) params.set("topic", topic);
    if (q) params.set("q", q);
    if (year) params.set("year", year);
    if (semester) params.set("semester", semester);
    params.set("sort", sort);

    setLoading(true);
    setErr(null);

    fetch(`/api/notes?${params.toString()}`)
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (!r.ok) throw new Error(json?.error || "FETCH_ERROR");
        return json;
      })
      .then((d) => setItems(d?.data ?? []))
      .catch((e) => setErr(e.message || "FETCH_ERROR"))
      .finally(() => setLoading(false));
  }, [subject, topic, q, year, semester, sort]);

  return (
    <div className="container-nv my-4">
      {/* Filtros */}
      <div className="section-card p-4 mb-4">
        <h1 className="nv-title fs-2 mb-2">Apuntes</h1>
        <p className="nv-subtitle">Busca, filtra y explora los apuntes de Ing. Civil Informática.</p>

        <div className="row g-3 mt-2">
          <div className="col-md-4">
            <label className="form-label">Asignatura</label>
            <select
              className="form-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">— Todas —</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Tema</label>
            <input
              className="form-control"
              placeholder="Grafos, Sistemas…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Palabras clave</label>
            <input
              className="form-control"
              placeholder="resumen, guía…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Año</label>
            <input
              type="number"
              min={2018}
              max={2099}
              className="form-control"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2025"
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Semestre</label>
            <select
              className="form-select"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="">—</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Ordenar</label>
            <select
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Recientes</option>
              <option value="downloads">Descargas</option>
              <option value="rating">Mejor valorados</option>
              <option value="views">Más vistos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout en 2 columnas con lógica para no duplicar CTA */}
      {loading ? (
        <div className="nv-card p-4 text-center">Cargando…</div>
      ) : err ? (
        <div className="nv-card p-4">
          <div className="fw-semibold mb-1">No pudimos cargar los apuntes.</div>
          <div className="text-secondary small">
            {err === "DB_UNAVAILABLE"
              ? "Problema de conexión con la base de datos. Intenta de nuevo más tarde."
              : "Intenta refrescar o probar más tarde."}
          </div>
        </div>
      ) : items.length === 0 ? (
// —— CASO SIN RESULTADOS: BLOQUE FULL WIDTH CON CTA (sin borde superior) ——
<div
  className="p-4 rounded-4 shadow-sm fade-in"
  style={{
    background: "linear-gradient(to bottom right, #ffffff, #f9fafc)",
    border: "1px solid #e5e7eb",
  }}
>
  <div className="fw-semibold fs-6 mb-2 text-gray-800">
    No hay resultados con los filtros actuales.
  </div>

  <p className="text-secondary small mb-4">
    Prueba cambiando la asignatura o las palabras clave.  
    También puedes compartir tu propio material para que otros lo encuentren y ayudes a la comunidad UAI:
  </p>

  <div
    className="p-4 rounded-4 shadow-sm"
    style={{
      background: "linear-gradient(to right, #f4f7ff, #f0f5ff)",
      border: "none",
      boxShadow: "0 4px 16px rgba(59,130,246,0.08)",
    }}
  >
    <UploadCTA />
  </div>
</div>

      ) : (
        // —— CASO CON RESULTADOS: grilla + CTA lateral (uno solo) ——
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="row g-3">
              {items.map((n) => (
                <div className="col-md-6" key={n._id}>
                  <div className="nv-card p-3 h-100">
                    <div className="small text-secondary mb-1">{n.subject}</div>
                    <h3 className="h6 mb-1">{n.title}</h3>
                    {n.description && (
                      <div className="small text-secondary nv-ellipsis-1">{n.description}</div>
                    )}
                    <a className="btn btn-soft btn-sm mt-3" href={`/apuntes/${n._id}`}>
                      Ver
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA lateral solo cuando hay resultados */}
          <div className="col-lg-4">
            <div style={{ position: "sticky", top: 96 }}>
              <UploadCTA />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
