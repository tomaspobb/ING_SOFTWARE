// src/app/apuntes/[id]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

// ⚠️ En Next 15, params es un Promise: hay que await
export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Pedimos por API del proyecto; sin cache para ver cambios altiro
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/notes/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <main className="container-nv py-4">
        <div className="alert alert-warning">
          {err?.error === "INVALID_ID"
            ? "El identificador del apunte no es válido."
            : "No pudimos cargar este apunte."}
        </div>
        <Link href="/apuntes" className="btn btn-soft">Volver</Link>
      </main>
    );
  }

  const { data: note } = await res.json();

  return (
    <main className="container-nv py-4">
      <div className="section-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h1 className="nv-title mb-1">{note.title}</h1>
            <div className="text-muted">
              {note.subject} ·{" "}
              {note.year ? `${note.year} · ` : ""}
              {note.semester ? `Sem ${note.semester}` : ""}
            </div>
          </div>

          <div className="d-flex gap-2">
            {/* Ver/Descargar si hay archivo */}
            {note.pdfUrl ? (
              <>
                <a
                  className="btn btn-primary"
                  href={`/api/notes/${note._id}/view`}
                  target="_blank"
                >
                  Ver
                </a>
                <a
                  className="btn btn-outline-primary"
                  href={`/api/notes/${note._id}/download`}
                >
                  Descargar
                </a>
              </>
            ) : null}
          </div>
        </div>

        {note.description ? (
          <p className="mt-3 mb-0">{note.description}</p>
        ) : null}

        {/* Chips de metadatos */}
        <div className="mt-3 d-flex flex-wrap gap-2">
          {note.topic ? <span className="nv-chip">Tema: {note.topic}</span> : null}
          <span className="nv-chip">Vistas: {note.views}</span>
          <span className="nv-chip">Descargas: {note.downloads}</span>
          <span className="nv-chip">
            Rating: {note.ratingAvg?.toFixed(1) ?? 0} ({note.ratingCount})
          </span>
        </div>
      </div>

      {/* Comentarios pronto… */}
      <div className="section-card p-4">
        <h5 className="mb-3">Comentarios</h5>
        <p className="text-muted m-0">Pronto podrás comentar aquí 👀</p>
      </div>
    </main>
  );
}

export const metadata: Metadata = {
  title: "Detalle de apunte – Notivium",
};
