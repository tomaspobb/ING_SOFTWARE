"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import NoteCard from "@/components/NoteCard";
import Link from "next/link";

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

export default function MisApuntesPage() {
  const { status } = useSession();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    setErr(null);
    fetch("/api/notes/mine")
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (!r.ok) throw new Error(json?.error || "FETCH_ERROR");
        return json;
      })
      .then((d) => setItems(d?.data ?? []))
      .catch((e) => setErr(e.message || "FETCH_ERROR"))
      .finally(() => setLoading(false));
  }, [status]);

  async function handleDelete(note: Note) {
    if (!confirm(`¿Eliminar "${note.title}"? Esto borra el PDF del Blob y su ficha en la BD.`)) {
      return;
    }
    try {
      setDeleting(note._id);
      const r = await fetch(`/api/notes/${note._id}`, { method: "DELETE" });
      const json = await r.json().catch(() => null);
      if (!r.ok) throw new Error(json?.error || "DELETE_ERROR");

      // elimina del estado
      setItems((prev) => prev.filter((n) => n._id !== note._id));
    } catch (e: any) {
      alert(`No se pudo eliminar: ${e?.message || "ERROR"}`);
    } finally {
      setDeleting(null);
    }
  }

  if (status === "loading") {
    return <div className="container-nv my-4 nv-card p-4">Cargando…</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="container-nv my-4 nv-card p-4">
        <div className="fw-semibold mb-2">Necesitas iniciar sesión</div>
        <div className="text-secondary small mb-3">
          Ingresa con tu cuenta Microsoft para ver y gestionar tus apuntes.
        </div>
        <Link href="/" className="btn btn-primary btn-pill">Ir al inicio</Link>
      </div>
    );
  }

  return (
    <div className="container-nv my-4">
      <div className="section-card p-4 mb-4 d-flex align-items-center justify-content-between">
        <div>
          <h1 className="nv-title fs-2 mb-1">Mis apuntes</h1>
          <p className="nv-subtitle m-0">Apuntes subidos por ti. Puedes verlos o eliminarlos.</p>
        </div>
        <Link href="/apuntes/upload" className="btn btn-primary btn-pill">
          Subir nuevo
        </Link>
      </div>

      {loading ? (
        <div className="nv-card p-4 text-center">Cargando…</div>
      ) : err ? (
        <div className="nv-card p-4">
          <div className="fw-semibold mb-1">No pudimos cargar tus apuntes.</div>
          <div className="text-secondary small">
            {err === "DB_UNAVAILABLE"
              ? "Problema de conexión con la base de datos."
              : "Intenta refrescar la página."}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="nv-card p-4 text-center">
          <div className="fw-semibold mb-1">Aún no has subido apuntes.</div>
          <div className="text-secondary small mb-3">
            Sube tu primer PDF y compártelo con la comunidad.
          </div>
          <Link href="/apuntes/upload" className="btn btn-primary btn-pill">
            Subir apunte
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {items.map((n) => (
            <div className="col-md-6" key={n._id}>
              <div className="position-relative">
                <NoteCard
                  id={n._id}
                  title={n.title}
                  description={n.description}
                  subject={n.subject}
                  topic={n.topic}
                  authorName={n.authorName}
                  year={n.year}
                  semester={n.semester}
                  downloads={n.downloads}
                  views={n.views}
                  ratingAvg={n.ratingAvg}
                  ratingCount={n.ratingCount}
                  keywords={n.keywords}
                  href={`/apuntes/${n._id}`}
                />
                <button
                  className="btn btn-light btn-sm position-absolute"
                  style={{ top: 8, right: 8, borderRadius: 999 }}
                  title="Eliminar apunte"
                  disabled={deleting === n._id}
                  onClick={() => handleDelete(n)}
                >
                  {deleting === n._id ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <i className="bi bi-trash3" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
