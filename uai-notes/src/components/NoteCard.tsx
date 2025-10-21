"use client";
import Link from "next/link";
import styles from "./NoteCard.module.css";

type Props = {
  id: string;
  title: string;
  description?: string;
  subject: string;
  authorName?: string;
  year?: number;
  semester?: number;
  downloads?: number;
  views?: number;
  ratingAvg?: number;
  ratingCount?: number;
  keywords?: string[];
};

export default function NoteCard({
  id,
  title,
  subject,
  authorName,
  year,
  semester,
  downloads = 0,
  views = 0,
  ratingAvg = 0,
  ratingCount = 0,
  keywords = [],
}: Props) {
  return (
    <Link href={`/apuntes/${id}`} className={styles.card}>
      <div className={styles.top}>
        <span className={styles.subject}>{subject}</span>
        <div className={styles.stats}>
          <span title="Vistas">
            <i className="bi bi-eye me-1" /> {views}
          </span>
          <span title="Descargas">
            <i className="bi bi-download ms-3 me-1" /> {downloads}
          </span>
          <span title="Promedio">
            <i className="bi bi-star-fill text-warning ms-3 me-1" />{" "}
            {ratingAvg.toFixed(1)}
          </span>
        </div>
      </div>

      <h3 className={styles.title}>{title}</h3>

      <div className={styles.meta}>
        <span>
          <i className="bi bi-person-circle me-1" />
          {authorName || "Anónimo"}
        </span>
        <span className={styles.year}>
          {year}/{semester}
        </span>
      </div>

      {keywords.length > 0 && (
        <div className={styles.tags}>
          {keywords.slice(0, 3).map((k) => (
            <span key={k} className={styles.tag}>
              #{k}
            </span>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.primary}`}>
          <i className="bi bi-eye me-1" />
          Ver
        </button>
        <button className={`${styles.btn} ${styles.soft}`}>
          <i className="bi bi-bookmark me-1" />
          Guardar
        </button>
      </div>
    </Link>
  );
}
