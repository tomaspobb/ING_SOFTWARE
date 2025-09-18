"use client";
import Link from "next/link";
import s from "./NoteCard.module.css";

type Props = {
  semester: string;
  downloads: number;
  title: string;
  description: string;
  author: string;
  compact?: boolean;

  href?: string;
  isSaved?: boolean;
  onSaveToggle?: () => void;
  onView?: () => void;
  tags?: string[];
  rating?: number; // 0..5
};

export default function NoteCard({
  semester, downloads, title, description, author,
  compact = false, href, isSaved = false, onSaveToggle, onView,
  tags = [], rating,
}: Props) {
  const CardContent = (
    <div className={`${s.card} ${compact ? s.compact : ""}`}>
      <div className={s.body}>
        {/* Meta */}
        <div className={s.meta}>
          <span className={s.badge} title={semester}>{semester}</span>
          <div className={s.stats}>
            {typeof rating === "number" && (
              <span title={`Puntaje ${rating.toFixed(1)}/5`}>
                <i className="bi bi-star-fill text-warning" /> {rating.toFixed(1)}
              </span>
            )}
            <span title={`${downloads} descargas`}>
              <i className="bi bi-download" /> {downloads}
            </span>
          </div>
        </div>

        {/* Título */}
        <h5 className={s.title} title={title}>{title}</h5>

        {/* Tags */}
        {tags.length > 0 && (
          <div className={s.tags}>
            {tags.slice(0,4).map(t => <span key={t} className={s.tag}>#{t}</span>)}
            {tags.length>4 && <span className={s.tag}>+{tags.length-4}</span>}
          </div>
        )}

        {/* Descripción */}
        <p className={s.desc} title={description}>{description}</p>

        {/* Footer */}
        <div className={s.foot}>
          <div className={`${s.ellipsis1}`} title={author}>
            <i className="bi bi-person-circle me-1" /> {author}
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary btn-pill"
              onClick={(e) => { e.preventDefault(); onView?.(); if (href) window.location.assign(href); }}
              aria-label="Ver apunte"
            >
              <i className="bi bi-eye me-1" /> Ver
            </button>
            <button
              className={`btn btn-sm btn-soft btn-pill ${isSaved ? "is-saved" : ""}`}
              onClick={(e) => { e.preventDefault(); onSaveToggle?.(); }}
              aria-pressed={isSaved}
              aria-label={isSaved ? "Quitar de guardados" : "Guardar apunte"}
              title={isSaved ? "Guardado" : "Guardar"}
            >
              <i className={`bi ${isSaved ? "bi-bookmark-fill" : "bi-bookmark"} me-1`} />
              {isSaved ? "Guardado" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={s.link} prefetch>
        {CardContent}
      </Link>
    );
  }
  return CardContent;
}
