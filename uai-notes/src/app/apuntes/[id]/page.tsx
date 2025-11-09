"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Star,
  Download,
  Eye,
  Calendar,
  Share2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

import ConfirmDialog from "@/components/ConfirmDialog";
// Si usas provider de modo editor:
import { useEditorMode } from "@/components/EditorModeProvider";

/* ===================== Tipos ===================== */
type Note = {
  _id: string;
  title: string;
  description?: string;
  subject?: string;
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
  updatedAt?: string;
};

type Comment = {
  _id: string;
  userName?: string;
  userEmail: string;
  text: string;
  createdAt: string;
};

type MyRating = { value: number } | null;

type SessionShape =
  | {
      user?: {
        name?: string;
        email?: string;
        role?: string;
        isEditor?: boolean;
      };
    }
  | null;

/* ===================== Página ===================== */
export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  /* ---------------- Resolver params (Next 15) ---------------- */
  const [noteId, setNoteId] = useState<string>("");
  useEffect(() => {
    let alive = true;
    (async () => {
      const { id } = await params;
      if (alive) setNoteId(id);
    })();
    return () => {
      alive = false;
    };
  }, [params]);

  /* ---------------- Estado UI + datos ---------------- */
  const [note, setNote] = useState<Note | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [myRating, setMyRating] = useState<MyRating>(null);
  const [savingRate, setSavingRate] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [openInfo, setOpenInfo] = useState(false);

  // sesión (para borrar comentarios propios) + modo editor
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [isEditor, setIsEditor] = useState<boolean>(false);
  const editorCtx = useEditorMode?.();
  const editorMode = editorCtx?.editorMode ?? false; // solo UI

  /* ---------------- Cargar sesión ---------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/auth/session", { credentials: "include" });
        if (!r.ok) return;
        const s: SessionShape = await r.json();
        if (!alive) return;
        setCurrentEmail(s?.user?.email ?? null);
        setIsEditor(Boolean(s?.user?.isEditor || s?.user?.role === "admin"));
      } catch {
        /* noop */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ---------------- Cargar nota + comentarios + mi rating ---------------- */
  useEffect(() => {
    if (!noteId) return;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const [noteRes, commentsRes, ratingRes] = await Promise.all([
          fetch(`/api/notes/${noteId}`, { signal: ac.signal }),
          fetch(`/api/notes/${noteId}/comments`, { signal: ac.signal }),
          fetch(`/api/notes/${noteId}/my-rating`, {
            credentials: "include",
            signal: ac.signal,
          }),
        ]);

        setNote(noteRes.ok ? (await noteRes.json()).data ?? null : null);
        setComments(
          commentsRes.ok ? (await commentsRes.json()).items ?? [] : []
        );
        setMyRating(
          ratingRes.ok ? (await ratingRes.json()).rating ?? null : null
        );
      } catch {
        /* noop (abort) */
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [noteId]);

  const created = useMemo(() => {
    if (!note?.createdAt) return "—";
    try {
      return new Date(note.createdAt).toLocaleDateString();
    } catch {
      return "—";
    }
  }, [note]);

  /* ---------------- Valorar ---------------- */
  async function onRate(value: number) {
    if (!noteId) return;
    try {
      setSavingRate(true);
      const res = await fetch(`/api/notes/${noteId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value }),
      });
      if (!res.ok) return;
      const j = await res.json();
      setMyRating({ value });
      setNote((n) =>
        n
          ? {
              ...n,
              ratingAvg: j.ratingAvg ?? n.ratingAvg,
              ratingCount: j.ratingCount ?? n.ratingCount,
            }
          : n
      );
    } finally {
      setSavingRate(false);
    }
  }

  /* ---------------- Crear comentario (con moderación) ---------------- */
  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!noteId || !commentText.trim()) return;

    setPostingComment(true);
    setCommentError(null);

    const optimistic: Comment = {
      _id: `tmp_${Date.now()}`,
      text: commentText.trim(),
      userEmail: currentEmail || "tú",
      userName: "Tú",
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);

    try {
      const res = await fetch(`/api/notes/${noteId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: optimistic.text }),
      });

      if (res.status === 401) {
        setComments((prev) => prev.filter((c) => c._id !== optimistic._id));
        setCommentError("Debes iniciar sesión para comentar.");
        return;
      }

      const j = await res.json().catch(() => null);

      if (!res.ok) {
        setComments((prev) => prev.filter((c) => c._id !== optimistic._id));
        setCommentError(j?.error || "No se pudo publicar el comentario.");
        return;
      }

      // si quedó pendiente de moderación, lo sacamos
      const pending =
        j?.pendingModeration === true || (j && j.moderated === false);
      if (pending) {
        setComments((prev) => prev.filter((c) => c._id !== optimistic._id));
        setCommentText("");
        return;
      }

      if (j?.item) {
        setComments((prev) =>
          prev.map((c) => (c._id === optimistic._id ? j.item : c))
        );
      } else {
        setComments((prev) => prev.filter((c) => c._id !== optimistic._id));
      }
      setCommentText("");
    } catch {
      setComments((prev) => prev.filter((c) => c._id !== optimistic._id));
      setCommentError("Error de red al publicar el comentario.");
    } finally {
      setPostingComment(false);
    }
  }

  /* ---------------- Eliminar comentario (autor o editor) con modal ---------------- */
  const deletingRef = useRef<string | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; commentId?: string }>(
    { open: false }
  );

  function requestDelete(commentId: string) {
    setConfirm({ open: true, commentId });
  }

  async function confirmDelete() {
    if (!noteId || !confirm.commentId || deletingRef.current) {
      setConfirm({ open: false });
      return;
    }

    const target = comments.find((c) => c._id === confirm.commentId);
    const canDelete =
      !!target &&
      (editorMode ||
        isEditor ||
        (currentEmail && target.userEmail === currentEmail));

    if (!canDelete) {
      setConfirm({ open: false });
      return;
    }

    deletingRef.current = confirm.commentId;
    const backup = comments;
    setComments((prev) => prev.filter((c) => c._id !== confirm.commentId));

    try {
      const res = await fetch(
        `/api/notes/${noteId}/comments?commentId=${confirm.commentId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error("DELETE_FAILED");
    } catch {
      setComments(backup);
      alert("No se pudo eliminar el comentario.");
    } finally {
      deletingRef.current = null;
      setConfirm({ open: false, commentId: undefined });
    }
  }

  /* ---------------- Renders ---------------- */
  if (loading) {
    return (
      <div className="container-nv py-4">
        <div className="nv-card p-4" style={{ borderRadius: 22 }}>
          Cargando apunte…
        </div>
      </div>
    );
  }

  if (!note?._id) {
    return (
      <div className="container-nv py-4">
        <div className="nv-card p-4" style={{ borderRadius: 22 }}>
          <strong>No pudimos cargar el apunte.</strong>
          <div className="text-muted small">
            Verifica el enlace o intenta más tarde.
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="container-nv py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-3">
        <Link href="/apuntes" prefetch={false} className="text-decoration-none small">
          ← Volver a Apuntes
        </Link>
      </div>

      <div className="row g-4">
        {/* Izquierda: visor + comentarios */}
        <div className="col-12 col-lg-8">
          <div className="nv-card p-0" style={{ borderRadius: 22, overflow: "hidden" }}>
            {note.pdfUrl ? (
              <iframe
                src={note.pdfUrl}
                style={{ width: "100%", height: "70vh", border: "0" }}
                title={note.title}
              />
            ) : (
              <div className="p-4 text-muted">Este apunte no tiene vista previa.</div>
            )}
          </div>

          {/* Comentarios */}
          <div className="nv-card p-4 mt-3" style={{ borderRadius: 22 }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h2 className="fs-5 mb-0">Comentarios</h2>
              <span className="text-muted small d-flex align-items-center gap-1">
                <MessageSquare size={16} /> {comments.length}
              </span>
            </div>

            <form onSubmit={submitComment} className="mb-3">
              <textarea
                className="form-control"
                placeholder="Escribe un comentario…"
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={postingComment}
              />
              <div className="d-flex justify-content-end mt-2">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={postingComment || !commentText.trim()}
                >
                  {postingComment ? "Publicando…" : "Publicar"}
                </button>
              </div>
              {commentError && (
                <div className="text-danger small mt-2">{commentError}</div>
              )}
            </form>

            {comments.length === 0 ? (
              <div className="text-muted small">Aún no hay comentarios.</div>
            ) : (
              <div className="vstack gap-3">
                {comments.map((c) => {
                  const canDelete =
                    editorMode || isEditor || (currentEmail && c.userEmail === currentEmail);
                  return (
                    <div
                      key={c._id}
                      className="p-3 rounded-3"
                      style={{ border: "1px solid #e7ecf7", background: "#fff" }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <strong className="small">
                          {c.userName || c.userEmail.split("@")[0]}
                        </strong>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted small">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn-link p-0 text-danger"
                              title="Eliminar comentario"
                              onClick={() => requestDelete(c._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="small">{c.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Derecha: info plegable + rating + meta + autor */}
        <div className="col-12 col-lg-4">
          <div style={{ position: "sticky", top: 96 }}>
            {/* Info/Descripción — PLEGABLE */}
            <div className="nv-card p-0 mb-3" style={{ borderRadius: 22, overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setOpenInfo((s) => !s)}
                className="w-100 text-start p-3 border-0 bg-transparent"
                style={{ cursor: "pointer" }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="nv-ellipsis-1 fw-semibold">
                      {note.subject || "—"} {note.year ? `• ${note.year}/${note.semester ?? ""}` : ""}
                    </div>
                    <div className="text-muted small nv-ellipsis-1">{note.title}</div>
                  </div>
                  {openInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {openInfo && (
                <div className="px-3 pb-3">
                  <p className="mb-2">{note.description || "Sin descripción."}</p>
                  {!!note.keywords?.length && (
                    <div className="d-flex flex-wrap gap-2">
                      {note.keywords!.map((k) => (
                        <span key={k} className="badge-soft px-2 py-1 small">#{k}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Valorar */}
            <div className="nv-card p-4 mb-3" style={{ borderRadius: 22 }}>
              <div className="d-flex align-items-center justify-content-between">
                <strong>Valorar</strong>
                <span className="text-muted small d-flex align-items-center gap-1">
                  <Eye size={14} /> {note.views ?? 0}
                </span>
              </div>
              <div className="text-muted small mb-2">
                Promedio:{" "}
                <strong>
                  {Number.isFinite(note.ratingAvg) ? Number(note.ratingAvg).toFixed(1) : "—"}
                </strong>{" "}
                <span className="text-muted">({note.ratingCount ?? 0})</span>
              </div>

              <RatingStars
                value={myRating?.value ?? 0}
                onChange={onRate}
                disabled={savingRate}
                showHint={!myRating}
              />

              {myRating ? (
                <div className="small text-muted mt-1">Tu voto: {myRating.value} ★</div>
              ) : (
                <div className="small text-muted mt-1">Aún no has votado este apunte.</div>
              )}
            </div>

            {/* Meta + acciones */}
            <div className="nv-card p-4 mb-3" style={{ borderRadius: 22 }}>
              <div className="vstack gap-2 small">
                <div className="d-flex align-items-center gap-2">
                  <Calendar size={14} /> Publicado: <strong>{created}</strong>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Download size={14} /> Descargas: <strong>{note.downloads ?? 0}</strong>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Share2 size={14} /> Compartir:
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                  >
                    Copiar enlace
                  </button>
                </div>
              </div>

              {note.pdfUrl && (
                <a
                  href={note.pdfUrl}
                  className="btn btn-primary w-100 mt-3"
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir PDF
                </a>
              )}
            </div>

            {/* Autor */}
            {(note.authorName || note.authorEmail) && (
              <div className="nv-card p-4" style={{ borderRadius: 22 }}>
                <div className="small text-muted">Autor/a</div>
                <div className="fw-semibold">{note.authorName || "Anónimo"}</div>
                {note.authorEmail && (
                  <a href={`mailto:${note.authorEmail}`} className="small">
                    {note.authorEmail}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminar comentario */}
      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={confirmDelete}
        options={{
          title: "Eliminar comentario",
          message: "¿Seguro que quieres eliminar este comentario? Esta acción no se puede deshacer.",
          confirmText: "Eliminar",
          cancelText: "Cancelar",
          danger: true,
        }}
      />
    </motion.div>
  );
}

/* ===================== RatingStars ===================== */
function RatingStars({
  value,
  onChange,
  disabled,
  showHint,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  showHint?: boolean;
}) {
  const [hover, setHover] = useState<number>(0);
  const filled = hover || value || 0;

  return (
    <div className="d-flex align-items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const active = filled >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="btn p-0"
            aria-label={`${n} estrellas`}
            title={`${n} estrellas`}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #e7ecf7",
              background: active ? "linear-gradient(90deg,#fde68a,#f59e0b)" : "#fff",
              color: active ? "#b45309" : "#64748b",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .15s",
            }}
          >
            <Star
              size={16}
              fill={active ? "#f59e0b" : "none"}
              color={active ? "#b45309" : "#64748b"}
            />
          </button>
        );
      })}
      {showHint && <span className="small text-muted ms-1">Califica para aportar al promedio</span>}
    </div>
  );
}
