import { notFound } from "next/navigation";
import Link from "next/link";
import { SUBJECTS } from "@/lib/subjects";

// Tracker de vistas en el cliente
function ViewTracker({ id }: { id: string }) {
  // cliente
  if (typeof window !== "undefined") {
    fetch(`/api/notes/${id}/view`, { method: "POST" }).catch(() => {});
  }
  return null;
}

type NoteDTO = {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  keywords?: string[];
  year?: number;
  semester?: number;
  authorName?: string;
  authorEmail?: string;
  pdfUrl?: string;
  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  moderated: boolean;
  createdAt: string;
};

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // server fetch (sin cache para ver contadores actualizados al recargar)
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/notes/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return notFound();
  const json = (await res.json()) as { ok: boolean; data?: NoteDTO };
  if (!json.ok || !json.data) return notFound();

  const n = json.data;

  return (
    <div className="container-nv my-4">
      {/* sumar vista al montar */}
      <ViewTracker id={n._id} />

      <div className="section-card p-4 mb-4">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <h1 className="display-6 mb-1">{n.title}</h1>
            <div className="text-secondary">
              {n.subject}
              {n.year ? ` · ${n.year}` : ""}{n.semester ? ` · S${n.semester}` : ""}
              {n.authorName ? ` · ${n.authorName}` : ""}
            </div>
          </div>

          <div className="d-flex gap-2">
            <a
              href={n.pdfUrl || "#"}
              target="_blank"
              className="btn btn-primary btn-pill"
              rel="noreferrer"
            >
              Ver
            </a>
            <Link
              href={`/api/notes/${n._id}/download`}
              className="btn btn-outline-primary btn-pill"
            >
              Descargar
            </Link>
          </div>
        </div>

        {n.description && <p className="mt-3 mb-2">{n.description}</p>}

        <div className="d-flex flex-wrap gap-2 mt-2">
          {n.topic && (
            <span className="badge-soft">Tema: {n.topic}</span>
          )}
          <span className="badge-soft">Vistas: {n.views ?? 0}</span>
          <span className="badge-soft">Descargas: {n.downloads ?? 0}</span>
          <span className="badge-soft">
            Rating: {Number(n.ratingAvg || 0).toFixed(1)} ({n.ratingCount || 0})
          </span>
          {n.keywords?.length
            ? n.keywords.map((k) => (
                <span key={k} className="badge-soft">{k}</span>
              ))
            : null}
        </div>
      </div>

      {/* Viewer simple si es PDF */}
      {n.pdfUrl?.toLowerCase().endsWith(".pdf") ? (
        <div className="section-card p-2">
          <iframe
            src={n.pdfUrl}
            title={n.title}
            style={{ width: "100%", height: "75vh", border: 0, borderRadius: 14 }}
          />
        </div>
      ) : (
        <div className="alert alert-info">
          Este archivo no es PDF o el visor no puede incrustarlo. Usa “Ver” o “Descargar”.
        </div>
      )}

      <div className="section-card p-4 mt-4">
        <h3 className="h5 mb-2">Comentarios</h3>
        <p className="text-secondary">Pronto podrás comentar aquí 👀</p>
      </div>
    </div>
  );
}
