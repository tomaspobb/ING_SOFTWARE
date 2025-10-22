"use client";
import Link from "next/link";

type NoteMod = {
  _id: string; title: string; subject: string; topic?: string;
  authorName?: string; year?: number; semester?: number; keywords?: string[];
};
type CommentMod = {
  _id: string; noteId: string; userName?: string; userEmail: string; text: string; createdAt: string;
};

export function ModerationNoteCard({
  n, onApprove, onReject,
}: { n: NoteMod; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="nv-card p-3 d-grid gap-2">
      <div className="d-flex align-items-center justify-content-between">
        <span className="badge text-bg-primary-subtle">{n.subject}</span>
        <div className="text-secondary small">{n.year}/{n.semester ?? "-"}</div>
      </div>

      <div className="fw-semibold">{n.title}</div>
      <div className="text-secondary small">
        {n.authorName || "—"} {n.topic ? <span className="ms-2">• {n.topic}</span> : null}
      </div>
      {n.keywords?.length ? (
        <div className="d-flex flex-wrap gap-2">
          {n.keywords.slice(0, 4).map(k => (
            <span key={k} className="badge rounded-pill text-bg-light">#{k}</span>
          ))}
        </div>
      ) : null}

      <div className="d-flex gap-2 mt-1">
        <Link className="btn btn-soft btn-sm" href={`/apuntes/${n._id}`} prefetch>Ver</Link>
        <button className="btn btn-success btn-sm" onClick={onApprove}>✓ Aprobar</button>
        <button className="btn btn-danger btn-sm" onClick={onReject}>✗ Rechazar</button>
      </div>
    </div>
  );
}

export function ModerationCommentCard({
  c, onApprove, onReject,
}: { c: CommentMod; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="nv-card p-3 d-grid gap-2">
      <div className="d-flex align-items-center justify-content-between">
        <div className="small fw-semibold">{c.userName || c.userEmail}</div>
        <div className="text-secondary small">{new Date(c.createdAt).toLocaleString()}</div>
      </div>
      <div className="border rounded p-2">{c.text}</div>
      <div className="d-flex gap-2">
        <Link className="btn btn-soft btn-sm" href={`/apuntes/${c.noteId}`} prefetch>Ir al apunte</Link>
        <button className="btn btn-success btn-sm" onClick={onApprove}>✓ Aprobar</button>
        <button className="btn btn-danger btn-sm" onClick={onReject}>✗ Rechazar</button>
      </div>
    </div>
  );
}
