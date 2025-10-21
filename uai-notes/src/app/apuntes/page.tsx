"use client";

import { useEffect, useMemo, useState } from "react";
import { SUBJECTS } from "@/lib/subjects";
import UploadCTA from "@/components/UploadCTA";
import NoteCard from "@/components/NoteCard";

type Note = {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  keywords?: string[];
  authorName?: string;
  authorEmail?: string;
  pdfUrl?: string;

  // nuevos metadatos visibles en la tarjeta
  year?: number;
  semester?: number;

  // métricas
  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;

  createdAt: string;
  updatedAt?: string;
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

  // años sugeridos (2025→2018)
  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const start = 2018;
    const arr: number[] = [];
    for (let y = now + 1; y >= start; y--) arr.push(y);
    return arr;
  }, []);

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
        <p className="nv-subtitle">
          Busca, filtra y explora los apuntes de Ing. Civil Informática.
        </p>

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
            <select
              className="form-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">—</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
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

      {/* Resultados */}
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
        // —— SIN RESULTADOS: bloque full width con CTA integrado
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
            Prueba cambiando la asignatura o las palabras clave. También puedes
            compartir tu propio material para que otros lo encuentren y ayudes a la
            comunidad UAI:
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
        // —— CON RESULTADOS: grilla + CTA lateral
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="row g-3">
              {items.map((n) => (
                <div className="col-md-6" key={n._id}>
                  <NoteCard
                    id={n._id}
                    title={n.title}
                    description={n.description}
                    subject={n.subject}
                    topic={n.topic}
                    authorName={n.authorName}
                    year={n.year}
                    semester={n.semester}
                    downloads={n.downloads}
                    views={n.views}
                    ratingAvg={n.ratingAvg}
                    ratingCount={n.ratingCount}
                    keywords={n.keywords}
                    href={`/apuntes/${n._id}`}
                  />
                </div>
              ))}
            </div>
          </div>

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
