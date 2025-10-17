"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Note = {
  _id: string;
  title: string;
  description?: string;
  subject?: string;
  topic?: string;
  semester?: string;
  fileUrl?: string;
  stats?: { views: number; downloads: number; ratingAvg: number; ratingCount: number };
};

type Comment = {
  _id: string;
  text: string;
  createdAt: string;
  author?: { name?: string; email?: string };
};

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  // comentarios
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // detalle
    fetch(`/api/notes/${id}`)
      .then((r) => r.json())
      .then((d) => setNote(d?.data ?? null))
      .finally(() => setLoading(false));

    // sumar vista
    fetch(`/api/notes/${id}/view`, { method: "POST" }).catch(() => {});

    // cargar comentarios
    fetch(`/api/notes/${id}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d?.data ?? []));
  }, [id]);

  async function handleDownload() {
    if (!id) return;
    // Aquí podrías abrir note.fileUrl en otra pestaña/descarga real
    // window.open(note?.fileUrl || "#", "_blank"); // si tienes el archivo
    await fetch(`/api/notes/${id}/download`, { method: "POST" });
    // refrescar conteo simple
    setNote((n) => (n ? ({ ...n, stats: { ...(n.stats||{}), downloads: (n.stats?.downloads ?? 0) + 1 } }) : n));
  }

  async function handleRate(value: number) {
    if (!id) return;
    const res = await fetch(`/api/notes/${id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }).then((r) => r.json());

    if (res?.ok) {
      setNote((n) => n ? ({
        ...n,
        stats: {
          ...(n.stats || {}),
          ratingAvg: res.avg ?? n.stats?.ratingAvg ?? 0,
          ratingCount: res.count ?? n.stats?.ratingCount ?? 0
        }
      }) : n);
    } else {
      alert(res?.error ?? "No se pudo valorar");
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !commentText.trim()) return;
    const res = await fetch(`/api/notes/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText.trim() }),
    }).then((r) => r.json());

    if (res?.ok) {
      setComments((prev) => [res.data, ...prev]);
      setCommentText("");
    } else {
      alert(res?.error ?? "No se pudo comentar");
    }
  }

  if (loading) return <div className="container-nv py-4">Cargando…</div>;
  if (!note) return <div className="container-nv py-4">No encontrado</div>;

  return (
    <div className="container-nv py-4">
      {/* HEADER */}
      <div className="section-card p-3 p-md-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h1 className="nv-title mb-1">{note.title}</h1>
            <div className="text-muted small">
              {note.subject || "Asignatura"} · {note.topic || "Tema"} · {note.semester || "—"}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="nv-chip">👁 {note.stats?.views ?? 0}</span>
            <span className="nv-chip">⬇ {note.stats?.downloads ?? 0}</span>
            <span className="nv-chip">★ {note.stats?.ratingAvg?.toFixed(1) ?? "0.0"} ({note.stats?.ratingCount ?? 0})</span>
          </div>
        </div>

        {note.description && <p className="mt-3 mb-0">{note.description}</p>}
      </div>

      {/* ACCIONES */}
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-primary btn-pill" onClick={handleDownload}>
          ⬇ Descargar
        </button>

        {/* Rating rápido */}
        <div className="d-inline-flex align-items-center gap-1">
          {[1,2,3,4,5].map((v) => (
            <button
              key={v}
              className="btn btn-soft btn-sm"
              onClick={() => handleRate(v)}
              title={`Valorar con ${v}`}
            >
              {v}★
            </button>
          ))}
        </div>
      </div>

      {/* COMENTARIOS */}
      <div className="section-card p-3 p-md-4 mt-3">
        <h2 className="nv-title fs-4 mb-3">Comentarios</h2>

        <form className="mb-3" onSubmit={handleCommentSubmit}>
          <div className="row g-2">
            <div className="col-12 col-md-9">
              <input
                className="form-control"
                placeholder="Escribe un comentario…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
              />
            </div>
            <div className="col-12 col-md-3 d-grid">
              <button className="btn btn-primary btn-pill" type="submit">Publicar</button>
            </div>
          </div>
        </form>

        {comments.length === 0 ? (
          <div className="text-muted">Aún no hay comentarios.</div>
        ) : (
          <div className="vstack gap-2">
            {comments.map((c) => (
              <div key={c._id} className="nv-card p-2">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="small text-muted nv-ellipsis-1">
                    {c.author?.name || c.author?.email || "Usuario"} • {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="mt-1">{c.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
