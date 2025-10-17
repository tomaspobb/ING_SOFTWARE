"use client";

import { useEffect, useMemo, useState } from "react";

type Note = {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  keywords?: string[];
  authorName?: string;
  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt?: string;
};

// mismos ramos que en el API (azules — sin Economía ni Optativos)
const SUBJECTS = [
  "Minería de Datos",
  "Inteligencia Artificial",
  "Sistemas de Información",
  "Seguridad en TI",
  "Gestión de Proyectos Informáticos",
  "Lenguajes y Paradigmas de Programación",
  "Diseño de Software",
  "Programación Profesional",
  "Ingeniería de Software",
  "Estrategia TI",
  "Estructuras de Datos y Algoritmos",
  "Redes de Computadores",
  "Arquitectura de Sistemas",
  "Arquitectura Cloud",
  "Bases de Datos",
  "Sistemas Operativos",
] as const;

const SORTS = [
  { key: "recent", label: "Recientes" },
  { key: "downloads", label: "Más descargados" },
  { key: "rating", label: "Mejor valorados" },
  { key: "views", label: "Más vistos" },
] as const;

export default function ApuntesRepositoryPage() {
  // filtros UI
  const [subject, setSubject] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [sort, setSort] = useState<string>("recent");

  // datos
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // paginación simple cliente
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  const pages = Math.max(1, Math.ceil(items.length / pageSize));

  const fetchNotes = () => {
    setLoading(true);
    setErrorMsg("");

    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (topic) params.set("topic", topic);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    // trae hasta 60 para paginar en cliente
    params.set("limit", "60");

    fetch(`/api/notes?${params.toString()}`)
      .then(async (r) => {
        let data: any = null;
        try {
          data = await r.json();
        } catch {
          // puede venir vacío si el server explotó
        }
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        return data;
      })
      .then((d) => {
        setItems(d?.data ?? []);
        setPage(1);
      })
      .catch((err) => {
        console.error("Notes fetch error:", err?.message || err);
        setItems([]);
        setErrorMsg(
          "No pudimos cargar los apuntes ahora mismo. Intenta de nuevo en unos minutos."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setSubject("");
    setTopic("");
    setQ("");
    setSort("recent");
    setPage(1);
    // opcional: vuelve a buscar sin filtros
    fetchNotes();
  };

  return (
    <div className="container-nv py-4">
      {/* ——— Cabecera / Filtros ——— */}
      <div className="section-card p-4 mb-4">
        <h2 className="nv-title mb-2">Apuntes</h2>
        <p className="nv-subtitle mb-3">
          Busca, filtra y explora los apuntes validados por la comunidad UAI.
        </p>

        <div className="row g-3">
          <div className="col-12 col-md-4">
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

          <div className="col-12 col-md-4">
            <label className="form-label">Tema</label>
            <input
              className="form-control"
              placeholder="Ej: Integrales"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Palabras clave</label>
            <input
              className="form-control"
              placeholder="resumen, guía, control…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="col-12 d-flex gap-2 align-items-end">
            <button className="btn btn-primary btn-pill" onClick={fetchNotes}>
              <i className="bi bi-search me-1" />
              Buscar
            </button>
            <button className="btn btn-light btn-pill" onClick={clearFilters}>
              Limpiar
            </button>

            <div className="ms-auto d-flex align-items-center gap-2">
              <span className="text-muted small">Ordenar por</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 190 }}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-warning mt-3 mb-0">{errorMsg}</div>
        )}
      </div>

      {/* ——— Grid de tarjetas ——— */}
      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : visible.length === 0 ? (
        <div className="nv-card p-4 text-center">
          <div className="mb-2">
            <i className="bi bi-journal-text" />
          </div>
          <p className="mb-0">No hay apuntes que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <>
          <div className="row g-3">
            {visible.map((n) => (
              <div key={n._id} className="col-12 col-md-6 col-lg-4">
                <div className="nv-card h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="badge-soft px-2 py-1 small nv-ellipsis-1">
                        {n.subject}
                      </span>
                      <span className="text-muted small">
                        <i className="bi bi-download me-1" />
                        {n.downloads ?? 0}
                      </span>
                    </div>

                    <h5 className="card-title mt-2 nv-ellipsis-1">{n.title}</h5>
                    <p className="card-text nv-clamp-2">{n.description}</p>

                    <div className="text-muted small mb-2">
                      {n.topic && (
                        <>
                          <i className="bi bi-tag me-1" />
                          {n.topic}
                        </>
                      )}
                    </div>

                    <div className="mt-auto d-flex align-items-center justify-content-between pt-1">
                      <div className="text-muted small nv-ellipsis-1">
                        <i className="bi bi-person-circle me-1" />
                        {n.authorName || "Autor"}
                      </div>
                      <div className="d-flex gap-2">
                        <a
                          className="btn btn-sm btn-outline-primary btn-pill"
                          href={`/apuntes/${n._id}`}
                          role="button"
                        >
                          <i className="bi bi-eye me-1" />
                          Ver
                        </a>
                        <button className="btn btn-sm btn-soft btn-pill">
                          <i className="bi bi-bookmark me-1" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ——— Paginación cliente ——— */}
          {pages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      «
                    </button>
                  </li>
                  {Array.from({ length: pages }).map((_, i) => (
                    <li
                      key={i}
                      className={`page-item ${page === i + 1 ? "active" : ""}`}
                    >
                      <button className="page-link" onClick={() => setPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li
                    className={`page-item ${page === pages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        setPage((p) => Math.min(pages, p + 1))
                      }
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
