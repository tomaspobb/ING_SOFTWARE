"use client";

import Link from "next/link";
import s from "./NoteCard.module.css";

type Props = {
  id: string;
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  authorName?: string;
  year?: number;
  semester?: number;
  downloads?: number;
  views?: number;
  ratingAvg?: number;
  ratingCount?: number;
  keywords?: string[];
  compact?: boolean;
  href?: string;

  // acciones del usuario
  isSaved?: boolean;
  onSaveToggle?: () => void;
  onView?: () => void;
};

/**
 * Tarjeta de apunte visualmente mejorada:
 * - Muestra vistas, descargas y rating con íconos
 * - Muestra metadatos: año, semestre, autor, tema
 * - Botones: Ver / Guardar (o Quitar de guardados)
 */
export default function NoteCard({
  id,
  title,
  description = "",
  subject,
  topic,
  authorName,
  year,
  semester,
  downloads = 0,
  views = 0,
  ratingAvg = 0,
  ratingCount = 0,
  keywords = [],
  compact = false,
  href,
  isSaved = false,
  onSaveToggle,
  onView,
}: Props) {
  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    onView?.();
    if (href) window.location.assign(href);
  };

  const CardContent = (
    <div className={`${s.card} ${compact ? s.compact : ""}`}>
      <div className={s.body}>
        {/* ---------- META SUPERIOR ---------- */}
        <div className={s.meta}>
          <span className={s.badge} title={`${subject}`}>
            {subject}
          </span>

          <div className={s.stats}>
            <span title={`${views} vistas`}>
              <i className="bi bi-eye me-1" /> {views}
            </span>
            <span title={`${downloads} descargas`}>
              <i className="bi bi-download me-1" /> {downloads}
            </span>
            {ratingCount > 0 && (
              <span title={`Puntaje ${ratingAvg.toFixed(1)} / 5`}>
                <i className="bi bi-star-fill text-warning me-1" />{" "}
                {ratingAvg.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* ---------- TÍTULO ---------- */}
        <h5 className={s.title} title={title}>
          {title}
        </h5>

        {/* ---------- TAGS (tema, año, semestre) ---------- */}
        <div className={s.tags}>
          {topic && <span className={s.tag}>#{topic}</span>}
          {year && <span className={s.tag}>{year}</span>}
          {semester && <span className={s.tag}>S{semester}</span>}
          {keywords.slice(0, 3).map((k) => (
            <span key={k} className={s.tag}>
              #{k}
            </span>
          ))}
          {keywords.length > 3 && (
            <span className={s.tag}>+{keywords.length - 3}</span>
          )}
        </div>

        {/* ---------- DESCRIPCIÓN ---------- */}
        {description && (
          <p className={s.desc} title={description}>
            {description}
          </p>
        )}

        {/* ---------- FOOTER ---------- */}
        <div className={s.foot}>
          <div className={`${s.ellipsis1}`} title={authorName || "Anónimo"}>
            <i className="bi bi-person-circle me-1" />{" "}
            {authorName || "Anónimo"}
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary btn-pill"
              onClick={handleView}
              aria-label="Ver apunte"
            >
              <i className="bi bi-eye me-1" /> Ver
            </button>
            <button
              className={`btn btn-sm btn-soft btn-pill ${
                isSaved ? "is-saved" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                onSaveToggle?.();
              }}
              aria-pressed={isSaved}
              aria-label={isSaved ? "Quitar de guardados" : "Guardar apunte"}
              title={isSaved ? "Guardado" : "Guardar"}
            >
              <i
                className={`bi ${
                  isSaved ? "bi-bookmark-fill" : "bi-bookmark"
                } me-1`}
              />
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
