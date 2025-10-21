// src/app/moderacion/page.tsx
"use client";

import { useEffect, useState } from "react";

type Note = {
  _id: string;
  title: string;
  subject: string;
  authorName?: string;
  authorEmail?: string;
  year?: number;
  semester?: number;
  pdfUrl?: string;
  createdAt: string;
};

type CommentT = {
  _id: string;
  noteId: string;
  text: string;
  userEmail: string;
  userName?: string;
  createdAt: string;
};

export default function ModeracionPage() {
  const [tab, setTab] = useState<"notes" | "comments">("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [comments, setComments] = useState<CommentT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchAll = async () => {
      const [nr, cr] = await Promise.all([
        fetch("/api/moderation/notes"),
        fetch("/api/moderation/comments"),
      ]);
      const nj = await nr.json().catch(() => null);
      const cj = await cr.json().catch(() => null);
      setNotes(nj?.data ?? []);
      setComments(cj?.data ?? []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  async function approveNote(id: string) {
    if (!confirm("¿Aprobar este apunte?")) return;
    const r = await fetch(`/api/notes/${id}`, { method: "PATCH" });
    if (r.ok) setNotes((l) => l.filter((n) => n._id !== id));
  }
  async function rejectNote(id: string) {
    if (!confirm("¿Rechazar y borrar este apunte?")) return;
    const r = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (r.ok) setNotes((l) => l.filter((n) => n._id !== id));
  }

  async function approveComment(id: string) {
    if (!confirm("¿Aprobar comentario?")) return;
    const r = await fetch(`/api/comments/${id}`, { method: "PATCH" });
    if (r.ok) setComments((l) => l.filter((c) => c._id !== id));
  }
  async function rejectComment(id: string) {
    if (!confirm("¿Eliminar comentario?")) return;
    const r = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (r.ok) setComments((l) => l.filter((c) => c._id !== id));
  }

  return (
    <div className="container-nv my-4">
      <div className="section-card p-4 mb-3 d-flex align-items-center justify-content-between">
        <div>
          <h1 className="nv-title fs-3 mb-1">Moderación</h1>
          <div className="text-secondary">Aprueba o rechaza contenido enviado por la comunidad.</div>
        </div>
        <div className="btn-group">
          <button className={`btn btn-light ${tab === "notes" ? "active" : ""}`} onClick={() => setTab("notes")}>
            Apuntes
          </button>
          <button className={`btn btn-light ${tab === "comments" ? "active" : ""}`} onClick={() => setTab("comments")}>
            Comentarios
          </button>
        </div>
      </div>

      {loading ? (
        <div className="nv-card p-4">Cargando…</div>
      ) : tab === "notes" ? (
        <div className="d-grid gap-3">
          {notes.length === 0 ? (
            <div className="nv-card p-4">No hay apuntes en cola 🎉</div>
          ) : (
            notes.map((n) => (
              <div key={n._id} className="nv-card p-3 d-flex align-items-start justify-content-between gap-3">
                <div>
                  <div className="small text-secondary mb-1">{n.subject}</div>
                  <div className="fw-semibold">{n.title}</div>
                  <div className="text-secondary small">
                    {n.authorName || "—"} • {n.authorEmail || "—"} · {new Date(n.createdAt).toLocaleString()}
                    {n.year ? <> · {n.year}/{n.semester ?? "-"}</> : null}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {n.pdfUrl ? (
                    <a className="btn btn-soft btn-sm" href={n.pdfUrl} target="_blank" rel="noreferrer">
                      <i className="bi bi-eye me-1" /> Ver
                    </a>
                  ) : null}
                  <button className="btn btn-success btn-sm" onClick={() => approveNote(n._id)}>
                    <i className="bi bi-check-lg me-1" /> Aprobar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => rejectNote(n._id)}>
                    <i className="bi bi-x-lg me-1" /> Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="d-grid gap-3">
          {comments.length === 0 ? (
            <div className="nv-card p-4">No hay comentarios en cola 🎉</div>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="nv-card p-3 d-flex align-items-start justify-content-between gap-3">
                <div>
                  <div className="fw-semibold mb-1">{c.userName || c.userEmail}</div>
                  <div className="text-secondary small mb-1">{new Date(c.createdAt).toLocaleString()}</div>
                  <div>{c.text}</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <a className="btn btn-soft btn-sm" href={`/apuntes/${c.noteId}`} target="_blank">
                    <i className="bi bi-box-arrow-up-right me-1" /> Ir al apunte
                  </a>
                  <button className="btn btn-success btn-sm" onClick={() => approveComment(c._id)}>
                    <i className="bi bi-check-lg me-1" /> Aprobar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => rejectComment(c._id)}>
                    <i className="bi bi-x-lg me-1" /> Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
