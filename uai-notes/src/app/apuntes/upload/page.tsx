"use client";

import { useState } from "react";
import { SUBJECTS } from "@/lib/subjects"; // tu lista 16 asignaturas

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // metadatos
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState<string>("");
  const [year, setYear] = useState<number | "">("");
  const [semester, setSemester] = useState<1 | 2 | "">("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!file) {
      setMsg("Selecciona un archivo PDF o imagen.");
      return;
    }
    if (!title || !subject) {
      setMsg("Título y asignatura son obligatorios.");
      return;
    }

    setSending(true);
    try {
      // 1) Subir a Blob
      const fd = new FormData();
      fd.append("file", file);
      fd.append("filename", file.name);

      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upJson = await up.json();
      if (!up.ok || !upJson?.ok) {
        throw new Error(upJson?.error || "Fallo al subir archivo");
      }

      // 2) Crear nota en Mongo
      const create = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subject,
          topic,
          keywords: keywords
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          year: year ? Number(year) : undefined,
          semester: semester ? Number(semester) : undefined,
          pdfUrl: upJson.url,
        }),
      });
      const cJson = await create.json();
      if (!create.ok || !cJson?.ok) {
        throw new Error(cJson?.error || "Error creando nota");
      }

      setMsg("¡Apunte enviado a moderación! Gracias por contribuir 🙌");
      // limpia formulario
      setFile(null);
      setTitle("");
      setDescription("");
      setSubject("");
      setTopic("");
      setKeywords("");
      setYear("");
      setSemester("");
    } catch (err: any) {
      setMsg(err?.message || "Error al subir.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container-nv my-4">
      <div className="section-card p-4">
        <h1 className="nv-title mb-1">Subir apunte</h1>
        <p className="nv-subtitle mb-4">
          Comparte tu PDF con título, asignatura, semestre y etiquetas para que la comunidad lo encuentre.
        </p>

        {msg && (
          <div className="alert alert-info" role="alert">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Título *</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Resumen Control 1 — Estructuras de Datos"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Asignatura *</label>
            <select
              className="form-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              <option value="">— Selecciona —</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Tema</label>
            <input
              className="form-control"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Grafos, Integrales, Reinforcement…"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Palabras clave</label>
            <input
              className="form-control"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="separadas por coma: resumen, guía, control…"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">Año</label>
            <input
              type="number"
              className="form-control"
              value={year}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
              placeholder="2025"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">Semestre</label>
            <select
              className="form-select"
              value={semester}
              onChange={(e) =>
                setSemester(e.target.value ? (Number(e.target.value) as 1 | 2) : "")
              }
            >
              <option value="">—</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Descripción</label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del contenido."
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Archivo (PDF/JPG/PNG) *</label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="form-control"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className="col-12 d-grid d-sm-block">
            <button disabled={sending} className="btn btn-primary btn-pill px-4">
              {sending ? "Subiendo…" : "Subir apunte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
