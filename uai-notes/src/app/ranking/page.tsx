"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Note = {
  _id: string; title: string; description?: string;
  subject?: string; semester?: string; downloads: number;
  ratingAvg: number; ratingCount: number;
};

export default function RankingPage() {
  const [items, setItems] = useState<Note[]>([]);
  const [metric, setMetric] = useState<"rating"|"downloads">("rating");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ranking?by=${metric}`).then(r => r.json()).then(d => {
      setItems(d.items ?? []); setLoading(false);
    });
  }, [metric]);

  return (
    <div className="container-nv py-4">
      <div className="section-card p-4 position-relative">
        <h1 className="nv-title mb-2">Ranking</h1>
        <p className="nv-subtitle">Top apuntes (últimos 30 días) por {metric==="rating" ? "rating" : "descargas"}.</p>

        <div className="d-flex gap-2 mt-2">
          <button className={`btn btn-soft btn-sm ${metric==="rating" ? "active":""}`}
            onClick={() => setMetric("rating")}>Mejor valorados</button>
          <button className={`btn btn-soft btn-sm ${metric==="downloads" ? "active":""}`}
            onClick={() => setMetric("downloads")}>Más descargados</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Cargando…</div>
      ) : (
        <div className="row g-3 mt-3">
          {items.map(n => (
            <div key={n._id} className="col-12 col-md-6 col-lg-4">
              <div className="nv-card p-3 h-100">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="badge-soft px-2 py-1 small nv-ellipsis-1">{n.semester ?? "—"}</span>
                  <span className="small text-muted">
                    {metric==="rating"
                      ? `★ ${n.ratingAvg.toFixed(1)} (${n.ratingCount})`
                      : `⬇ ${n.downloads} desc.`}
                  </span>
                </div>

                <h5 className="card-title nv-ellipsis-1">{n.title}</h5>
                <p className="card-text nv-clamp-2">{n.description ?? ""}</p>

                <div className="mt-auto d-flex align-items-center justify-content-between pt-1">
                  <span className="text-muted small nv-ellipsis-1">
                    {n.subject ?? "Asignatura"}
                  </span>
                  <Link className="btn btn-sm btn-outline-primary btn-pill" href={`/apuntes?id=${n._id}`}>
                    Ver
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
