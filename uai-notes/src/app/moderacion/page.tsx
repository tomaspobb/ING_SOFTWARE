"use client";
import { useEffect, useState } from "react";
import NoteCard from "@/components/NoteCard"; // tu tarjeta bonita
import Link from "next/link";

type Note = {
  _id: string; title: string; subject: string; topic?: string;
  authorName?: string; year?: number; semester?: number;
  downloads: number; views: number; ratingAvg: number; ratingCount: number;
  keywords?: string[];
};

type Comment = {
  _id: string; noteId: string; userName?: string; userEmail: string;
  text: string; createdAt: string; moderated: boolean;
};

export default function ModeracionPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    setBusy(true);
    try {
      const [n, c] = await Promise.all([
        fetch("/api/notes?moderated=false&limit=100").then(r => r.json()),
        fetch("/api/moderation/comments?pending=1").then(r => r.json()),
      ]);
      setNotes(n?.data ?? []);
      setComments(c?.data ?? []);
    } finally { setBusy(false); }
  }

  useEffect(() => { loadAll(); }, []);

  async function approveNote(id: string) {
    const ok = confirm("¿Aprobar este apunte?");
    if (!ok) return;
    const r = await fetch(`/api/notes/${id}`, { method: "PATCH" });
    const j = await r.json().catch(() => null);
    if (!r.ok) return alert(j?.error || "PATCH_ERROR");
    setNotes(list => list.filter(x => x._id !== id));
  }

  async function rejectNote(id: string) {
    const ok = confirm("¿Rechazar y borrar este apunte?");
    if (!ok) return;
    const r = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => null);
    if (!r.ok) return alert(j?.error || "DELETE_ERROR");
    setNotes(list => list.filter(x => x._id !== id));
  }

  async function approveComment(id: string) {
    const r = await fetch(`/api/comments/${id}`, { method: "PATCH", body: JSON.stringify({ approve: true }), headers: { "Content-Type": "application/json" }});
    const j = await r.json().catch(() => null);
    if (!r.ok) return alert(j?.error || "PATCH_ERROR");
    setComments(list => list.filter(x => x._id !== id));
  }

  async function rejectComment(id: string) {
    const ok = confirm("¿Eliminar comentario?");
    if (!ok) return;
    const r = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => null);
    if (!r.ok) return alert(j?.error || "DELETE_ERROR");
    setComments(list => list.filter(x => x._id !== id));
  }

  return (
    <div className="container-nv my-4">
      <div className="section-card p-4 mb-3">
        <h1 className="nv-title fs-2 mb-1">Moderación</h1>
        <p className="nv-subtitle m-0">Aprueba o rechaza apuntes y comentarios pendientes.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="nv-card p-3">
            <div className="fw-semibold mb-2">Apuntes pendientes</div>
            {notes.length === 0 ? (
              <div className="text-secondary small">Sin pendientes.</div>
            ) : (
              <div className="d-grid gap-3">
                {notes.map(n => (
                  <div key={n._id} className="nv-card p-3">
                    <NoteCard
                      id={n._id}
                      title={n.title}
                      description=""
                      subject={n.subject}
                      topic={n.topic}
                      authorName={n.authorName || "-"}
                      year={n.year}
                      semester={n.semester}
                      downloads={n.downloads}
                      views={n.views}
                      ratingAvg={n.ratingAvg}
                      ratingCount={n.ratingCount}
                      keywords={n.keywords || []}
                      href={`/apuntes/${n._id}`}
                      compact
                    />
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-success btn-sm" onClick={() => approveNote(n._id)}>✔ Aprobar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => rejectNote(n._id)}>✖ Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="nv-card p-3">
            <div className="fw-semibold mb-2">Comentarios pendientes</div>
            {comments.length === 0 ? (
              <div className="text-secondary small">Sin pendientes.</div>
            ) : (
              <div className="d-grid gap-3">
                {comments.map(c => (
                  <div key={c._id} className="nv-card p-3">
                    <div className="small opacity-75 mb-1">
                      {c.userName || c.userEmail} · {new Date(c.createdAt).toLocaleString()}
                    </div>
                    <div className="mb-2">{c.text}</div>
                    <div className="d-flex gap-2">
                      <Link className="btn btn-soft btn-sm" href={`/apuntes/${c.noteId}`}>Ver apunte</Link>
                      <button className="btn btn-success btn-sm" onClick={() => approveComment(c._id)}>✔ Aprobar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => rejectComment(c._id)}>🗑 Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {busy && <div className="text-secondary small mt-3">Cargando…</div>}
    </div>
  );
}
