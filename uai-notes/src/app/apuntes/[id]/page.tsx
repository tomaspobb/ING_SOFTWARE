"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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
  year?: number;
  semester?: number;
  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
};

type Comment = {
  _id: string;
  userEmail: string;
  userName?: string;
  text: string;
  createdAt: string;
};

function Star({ filled }: { filled: boolean }) {
  return <i className={`bi ${filled ? "bi-star-fill text-warning" : "bi-star text-secondary"}`} />;
}

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // Carga nota
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);

    fetch(`/api/notes/${id}`)
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || "FETCH_ERROR");
        return j;
      })
      .then((j) => {
        if (!cancelled) setNote(j.data);
      })
      .catch((e) => {
        if (!cancelled) setErr(e?.message || "FETCH_ERROR");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Carga comentarios visibles
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/notes/${id}/comments`)
      .then((r) => r.json().catch(() => null))
      .then((j) => {
        if (!cancelled && j?.ok) setComments(j.data ?? []);
      })
      .catch(() => {})
    return () => { cancelled = true; };
  }, [id]);

  async function handleSendComment() {
    const text = commentText.trim();
    if (!text) return;
    setSendingComment(true);
    try {
      const r = await fetch(`/api/notes/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || "COMMENT_ERROR");

      setCommentText("");
      if (j.data?.moderated) {
        setComments((curr) => [{ ...j.data }, ...curr]);
      } else {
        alert("Tu comentario quedó en revisión y será visible cuando sea aprobado. 🙌");
      }
    } catch (e: any) {
      alert(e.message || "No pudimos enviar tu comentario 😞");
    } finally {
      setSendingComment(false);
    }
  }

  if (loading) {
    return (
      <div className="container-nv my-4">
        <div className="nv-card p-4">Cargando…</div>
      </div>
    );
  }
  if (err || !note) {
    return (
      <div className="container-nv my-4">
        <div className="nv-card p-4">No pudimos cargar el apunte. {err ?? ""}</div>
      </div>
    );
  }

  // … (el resto de tu UI igual que lo tenías: cabecera, iframe, rating, comentarios)
  // no lo repito para no alargar, porque la parte importante eran los fetch.
  return (
    <div className="container-nv my-4">
      {/* Header */}
      <div className="section-card p-4 mb-3">
        <div className="d-flex align-items-center justify-content-between gap-3">
          <div>
            <div className="small text-secondary mb-1">{note.subject}</div>
            <h1 className="nv-title fs-3 mb-1">{note.title}</h1>
            {(note.authorName || note.authorEmail) && (
              <div className="text-secondary small">
                {note.authorName ?? "—"} <span className="opacity-75">•</span> {note.authorEmail ?? "—"}
              </div>
            )}
          </div>
          <div className="text-end">
            <div className="small mb-1">
              <i className="bi bi-star-fill text-warning" /> <b>{note.ratingAvg.toFixed(1)}</b> ({note.ratingCount})
              <span className="ms-3"><i className="bi bi-eye" /> {note.views}</span>
              <span className="ms-3"><i className="bi bi-download" /> {note.downloads}</span>
            </div>
            {note.pdfUrl && (
              <a href={note.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                <i className="bi bi-download me-1" /> Descargar PDF
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="nv-card p-2">
            {note.pdfUrl ? (
              <iframe src={note.pdfUrl} style={{ width: "100%", height: "78vh", border: "none", borderRadius: 12 }} />
            ) : (
              <div className="p-4 text-secondary small">Este apunte aún no tiene un PDF asociado.</div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div style={{ position: "sticky", top: 96 }} className="d-grid gap-3">
            {/* Rating, Comentarios… igual que tenías, dejando handleSendComment */}
            <div className="nv-card p-3">
              <div className="fw-semibold mb-2">Comentarios</div>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Escribe tu comentario…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="d-flex justify-content-end mt-2">
                <button className="btn btn-primary btn-sm" onClick={handleSendComment} disabled={sendingComment || !commentText.trim()}>
                  {sendingComment ? "Enviando…" : "Publicar"}
                </button>
              </div>

              {comments.length === 0 ? (
                <div className="text-secondary small mt-3">No hay comentarios aún.</div>
              ) : (
                <ul className="list-unstyled m-0 d-grid gap-3 mt-3">
                  {comments.map((c) => (
                    <li key={c._id} className="p-2 rounded border">
                      <div className="small opacity-75 mb-1">
                        {c.userName || c.userEmail} · {new Date(c.createdAt).toLocaleString()}
                      </div>
                      <div>{c.text}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
