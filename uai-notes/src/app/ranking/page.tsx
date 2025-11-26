"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SUBJECTS } from "@/lib/subjects";
import { LayoutGrid, List, TrendingUp, TrendingDown, Star, Download } from "lucide-react";

/* ===== Types (soporta campos opcionales por si el backend aún no los expone) ===== */
type Note = {
  _id: string;
  title: string;
  description?: string;
  subject?: string;
  semester?: string | number;
  downloads: number;
  ratingAvg: number;
  ratingCount: number;
  authorName?: string;
  // opcionales para valor agregado (no rompen si no existen)
  trend?: number[];       // serie corta (7-12 puntos normalizados 0..1)
  rank?: number;
  prevRank?: number;
};

type Metric = "rating" | "downloads";
type View = "list" | "grid";

export default function RankingPage() {
  const [items, setItems] = useState<Note[]>([]);
  const [metric, setMetric] = useState<Metric>("rating");
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [subject, setSubject] = useState<string>("");
  const [view, setView] = useState<View>("grid");
  const [loading, setLoading] = useState(true);

  // fetch
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("by", metric);
    params.set("days", String(days));
    if (subject) params.set("subject", subject);

    fetch(`/api/ranking?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [metric, days, subject]);

  // top3 + resto
  const [top3, rest] = useMemo(() => {
    const sorted = [...items];
    return [sorted.slice(0, 3), sorted.slice(3)];
  }, [items]);

  return (
    <motion.div
      className="container-nv py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header / controles */}
      <div className="section-card p-4 position-relative" style={{ borderRadius: 22 }}>
        <h1 className="nv-title mb-2">Ranking</h1>
        <p className="nv-subtitle">
          Top apuntes (últimos {days} días){subject ? ` — ${subject}` : ""} por{" "}
          {metric === "rating" ? "rating" : "descargas"}.
        </p>

        <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
          {/* Tabs de métrica */}
          <div className="btn-group me-2" role="group" aria-label="metric">
            <button
              className={`btn btn-soft btn-sm ${metric === "rating" ? "active" : ""}`}
              onClick={() => setMetric("rating")}
            >
              <Star size={14} className="me-1" /> Mejor valorados
            </button>
            <button
              className={`btn btn-soft btn-sm ${metric === "downloads" ? "active" : ""}`}
              onClick={() => setMetric("downloads")}
            >
              <Download size={14} className="me-1" /> Más descargados
            </button>
          </div>

          {/* Rango temporal */}
          <div className="btn-group me-2" role="group" aria-label="days">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                className={`btn btn-outline-secondary btn-sm ${days === d ? "active" : ""}`}
                onClick={() => setDays(d as 7 | 30 | 90)}
              >
                {d} días
              </button>
            ))}
          </div>

          {/* Filtro de asignatura (opcional) */}
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: 220 }}
            >
              <option value="">Todas las asignaturas</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cargando */}
      {loading && (
        <div className="row g-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="col-12 col-md-6 col-lg-4" key={i}>
              <div
                className="nv-card p-3"
                style={{ borderRadius: 22, minHeight: 150, background: "linear-gradient(180deg,#f7f9ff,#ffffff)" }}
              >
                <div className="placeholder-glow">
                  <span className="placeholder col-5"></span>
                </div>
                <div className="placeholder-glow mt-2">
                  <span className="placeholder col-8"></span>
                </div>
                <div className="placeholder-glow mt-3">
                  <span className="placeholder col-12"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Podio Top 3 */}
      {!loading && top3.length > 0 && (
        <div className="row g-3 mt-4">
          {top3.map((n, idx) => (
            <div className="col-12 col-md-4" key={n._id}>
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="nv-card p-3 h-100"
                style={{
                  borderRadius: 22,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Medalla */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: 6,
                    width: "100%",
                    background:
                      idx === 0
                        ? "linear-gradient(90deg,#f59e0b,#fcd34d)" // oro
                        : idx === 1
                        ? "linear-gradient(90deg,#94a3b8,#e2e8f0)" // plata
                        : "linear-gradient(90deg,#b45309,#f59e0b)", // bronce
                  }}
                />
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge-soft px-2 py-1 small">{n.subject ?? "—"}</span>
                  <RankDelta rank={n.rank} prevRank={n.prevRank} />
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: "linear-gradient(180deg,#eef3ff,#f8fbff)",
                      border: "1px solid #e7ecf7",
                      fontWeight: 800,
                    }}
                  >
                    #{(n.rank ?? idx + 1)}
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="card-title nv-ellipsis-1 mb-1">{n.title}</h5>
                    <div className="text-muted small nv-ellipsis-1">
                      {n.authorName || "Anónimo"} {n.semester ? `• ${n.semester}` : ""}
                    </div>
                  </div>
                </div>

                {/* Métrica + sparkline */}
                <div className="d-flex align-items-end justify-content-between mt-3">
                  <div className="d-flex align-items-center gap-2">
                    {metric === "rating" ? (
                      <>
                        <Star size={16} className="text-warning" />
                        <strong>{n.ratingAvg?.toFixed(1) ?? "—"}</strong>
                        <span className="text-muted small">({n.ratingCount ?? 0})</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <strong>{n.downloads ?? 0}</strong>
                        <span className="text-muted small">desc.</span>
                      </>
                    )}
                  </div>
                  <Sparkline data={n.trend} />
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <Link className="btn btn-sm btn-outline-primary" href={`/apuntes/${n._id}`}>
                    Ver apunte
                  </Link>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* Resto del ranking */}
      {!loading && rest.length > 0 && (
        <div className="mt-3">
          {view === "grid" ? (
            <div className="row g-3">
              {rest.map((n, i) => (
                <div className="col-12 col-md-6 col-lg-4" key={n._id}>
                  <motion.div
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    className="nv-card p-3 h-100"
                    style={{ borderRadius: 22 }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="text-muted small">#{n.rank ?? i + 4}</div>
                      <RankDelta rank={n.rank} prevRank={n.prevRank} />
                    </div>

                    <h5 className="card-title nv-ellipsis-1">{n.title}</h5>
                    <p className="card-text nv-clamp-2">{n.description ?? ""}</p>

                    <div className="mt-auto d-flex align-items-center justify-content-between">
                      <span className="text-muted small nv-ellipsis-1">
                        {n.subject ?? "Asignatura"} {n.semester ? `• ${n.semester}` : ""}
                      </span>

                      <div className="d-flex align-items-center gap-2">
                        {metric === "rating" ? (
                          <>
                            <Star size={14} className="text-warning" />
                            <strong className="small">{n.ratingAvg?.toFixed(1) ?? "—"}</strong>
                            <span className="text-muted small">({n.ratingCount ?? 0})</span>
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            <strong className="small">{n.downloads ?? 0}</strong>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mt-2">
                      <Sparkline data={n.trend} />
                      <Link className="btn btn-sm btn-outline-primary" href={`/apuntes/${n._id}`}>
                        Ver
                      </Link>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          ) : (
            // LISTA
            <div className="list-group">
              {rest.map((n, i) => (
                <a
                  key={n._id}
                  href={`/apuntes/${n._id}`}
                  className="list-group-item list-group-item-action d-flex align-items-center justify-content-between nv-surface-dim"
                  style={{ borderRadius: 14, marginBottom: 8 }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span className="badge-soft px-2 py-1">#{n.rank ?? i + 4}</span>
                    <div>
                      <div className="fw-semibold nv-ellipsis-1">{n.title}</div>
                      <div className="text-muted small nv-ellipsis-1">
                        {n.subject ?? "Asignatura"} {n.semester ? `• ${n.semester}` : ""} •{" "}
                        {metric === "rating"
                          ? `★ ${n.ratingAvg?.toFixed(1) ?? "—"} (${n.ratingCount ?? 0})`
                          : `${n.downloads ?? 0} desc.`}
                      </div>
                    </div>
                  </div>
                  <div className="d-none d-md-block">
                    <Sparkline data={n.trend} width={120} height={30} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vacío */}
      {!loading && items.length === 0 && (
        <div className="text-center py-5 nv-subtitle">No hay datos para este rango o filtro.</div>
      )}
    </motion.div>
  );
}

/* ====== Componentes auxiliares ====== */

/** Sparkline minimalista (sin libs). data debe ser [0..1]. Si no hay data, muestra una línea base sutil. */
function Sparkline({
  data,
  width = 100,
  height = 32,
}: {
  data?: number[];
  width?: number;
  height?: number;
}) {
  const pad = 2;
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden>
        <line
          x1={pad}
          x2={width - pad}
          y1={height - pad - 4}
          y2={height - pad - 4}
          stroke="rgba(99,102,241,.35)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  const step = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - Math.max(0, Math.min(1, v))) * (height - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline
        fill="none"
        stroke="rgba(99,102,241,.9)"
        strokeWidth="2"
        points={pts.join(" ")}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Badge que muestra subida/bajada de ranking si rank/prevRank existen */
function RankDelta({ rank, prevRank }: { rank?: number; prevRank?: number }) {
  if (!rank || !prevRank || rank === prevRank) return null;
  const delta = prevRank - rank; // positivo = subió
  const up = delta > 0;
  return (
    <span
      className="d-inline-flex align-items-center gap-1 px-2 py-1 small"
      style={{
        borderRadius: 999,
        border: "1px solid #e7ecf7",
        background: up ? "rgba(16,185,129,.08)" : "rgba(239,68,68,.08)",
        color: up ? "#059669" : "#dc2626",
        fontWeight: 600,
      }}
      title={`Cambio de ranking: ${delta > 0 ? "+" : ""}${delta}`}
    >
      {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {delta > 0 ? `+${delta}` : delta}
    </span>
  );
}