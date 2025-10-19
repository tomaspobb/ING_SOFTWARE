// src/app/apuntes/upload/page.tsx
"use client";

import { useState } from "react";
import { SUBJECTS } from "@/lib/subjects";


type UploadState = "idle" | "uploading" | "saving" | "done" | "error";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [semester, setSemester] = useState<number | "">("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [description, setDescription] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadState>("idle");
  const [msg, setMsg] = useState("");

  const addKw = () => {
    const v = kwInput.trim();
    if (v && !keywords.includes(v)) setKeywords((k) => [...k, v]);
    setKwInput("");
  };
  const removeKw = (k: string) =>
    setKeywords((arr) => arr.filter((x) => x !== k));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (!title || !subject) {
      setMsg("Título y asignatura son obligatorios.");
      return;
    }
    if (!file) {
      setMsg("Debes adjuntar un PDF.");
      return;
    }

    try {
      setStatus("uploading");
      // 1) Subir al Blob via API del proyecto
      const form = new FormData();
      form.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const upJson = await up.json();
      if (!up.ok || !upJson?.url) throw new Error(upJson?.error || "UPLOAD_FAIL");

      setStatus("saving");
      // 2) Crear documento en Mongo
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          topic,
          description,
          keywords,
          year: year || undefined,
          semester: semester || undefined,
          pdfUrl: upJson.url, // <- guardamos la URL del Blob
        }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "CREATE_FAIL");

      setStatus("done");
      setMsg("¡Apunte subido!");
    } catch (err: any) {
      setStatus("error");
      setMsg(err?.message || "Error subiendo apunte.");
    }
  }

  return (
    <main className="container-nv py-4">
      <div className="section-card p-4">
        <h1 className="nv-title mb-3">Subir apunte</h1>

        {msg && (
          <div
            className={`alert ${
              status === "done"
                ? "alert-success"
                : status === "error"
                ? "alert-danger"
                : "alert-info"
            }`}
          >
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Título *</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Asignatura *</label>
            <select
              className="form-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              <option value="">Selecciona…</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Tema</label>
            <input
              className="form-control"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Integrales, Grafos, …"
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Año</label>
            <input
              className="form-control"
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) =>
                setYear(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="2025"
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Semestre</label>
            <select
              className="form-select"
              value={semester}
              onChange={(e) =>
                setSemester(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">—</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div className="col-md-12">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del contenido…"
            />
          </div>

          <div className="col-md-12">
            <label className="form-label">Palabras clave</label>
            <div className="d-flex gap-2">
              <input
                className="form-control"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKw())}
                placeholder="resumen, guía, integrales…"
              />
              <button type="button" className="btn btn-soft" onClick={addKw}>
                Agregar
              </button>
            </div>
            <div className="mt-2 d-flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span key={k} className="nv-chip">
                  {k}
                  <button
                    type="button"
                    className="btn btn-sm btn-link ms-1 p-0"
                    onClick={() => removeKw(k)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label">Archivo PDF *</label>
            <input
              className="form-control"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className="col-12">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={status === "uploading" || status === "saving"}
            >
              {status === "uploading"
                ? "Subiendo archivo…"
                : status === "saving"
                ? "Guardando…"
                : "Subir apunte"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
