// src/app/apuntes/upload/page.tsx
"use client";

import { useEffect, useState } from "react";
import { SUBJECTS } from "@/lib/subjects";

/** Sugerencias simples de tema basadas en título + asignatura */
function suggestTopic(subject: string, title: string) {
  const t = title.toLowerCase();
  const map: Record<string, { kw: RegExp; topic: string }[]> = {
    "Arquitectura Cloud": [
      { kw: /kubernetes|aks|pods?|clusters?/, topic: "Cómputo y Almacenamiento" },
      { kw: /serverless|lambda|functions?/, topic: "Serverless y Funciones" },
      { kw: /network|vnet|cdn|dns/, topic: "Red y Entrega de Contenido" },
    ],
    "Bases de Datos": [
      { kw: /sql|relacional|joins?/, topic: "Modelado y SQL" },
      { kw: /nosql|mongo|documento/, topic: "NoSQL y Documentos" },
      { kw: /replica|shard|cluster/, topic: "Replicación y Sharding" },
    ],
  };
  const rules = map[subject] || [];
  for (const r of rules) if (r.kw.test(t)) return r.topic;
  return "";
}

/** Slug simple y seguro para nombre de archivo */
function niceSlug(s: string) {
  const base = (s || "archivo")
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 80);
  return base || "archivo";
}

/** Subir al Blob: devuelve URL pública */
async function uploadBlob(f: File, suggestedName: string): Promise<string> {
  const ext = (f.name.split(".").pop() || "pdf").toLowerCase();
  const fd = new FormData();
  fd.append("file", f);
  fd.append("filename", `${niceSlug(suggestedName)}.${ext}`);

  const r = await fetch("/api/upload", { method: "POST", body: fd });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.ok || !j?.url) {
    throw new Error(j?.error || "UPLOAD_ERROR");
  }
  return j.url as string;
}

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [desc, setDesc] = useState("");
  const [year, setYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Sugerir topic al cambiar título/asignatura (si aún no hay uno escrito)
  useEffect(() => {
    if (!subject || !title) return;
    if (topic.trim()) return;
    const sug = suggestTopic(subject, title);
    if (sug) setTopic(sug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, title]);

  function validateFile(f: File | null) {
    if (!f) return "Debes adjuntar un archivo (PDF/JPG/PNG).";
    const okTypes = ["application/pdf", "image/jpeg", "image/png"];
    const okExts = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!okTypes.includes(f.type) && !okExts.includes(ext)) {
      return "Formato no permitido. Usa PDF, JPG o PNG.";
    }
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);

    if (!title.trim()) return setErr("El título es obligatorio.");
    if (!subject) return setErr("Debes seleccionar una asignatura.");
    if (!year) return setErr("El año es obligatorio.");
    if (!semester || !["1", "2"].includes(semester)) {
      return setErr("El semestre es obligatorio (1 o 2).");
    }

    const kw = keywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (kw.length < 1) return setErr("Debes ingresar al menos una palabra clave.");
    const fileError = validateFile(file);
    if (fileError) return setErr(fileError);

    try {
      setBusy(true);

      // ⬆️ Subida al Blob (usar título como nombre “bonito”)
      const url = await uploadBlob(file!, title || file!.name);

      // 📝 Crear la ficha en Mongo (queda en moderación)
      const r = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject,
          topic,
          description: desc, // opcional
          year: Number(year),
          semester: Number(semester),
          keywords: kw,
          pdfUrl: url,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || "CREATE_ERROR");

      setOk(true);
      // limpiar formulario
      setTitle("");
      setSubject("");
      setTopic("");
      setDesc("");
      setYear("");
      setSemester("");
      setKeywords("");
      setFile(null);
    } catch (e: any) {
      setErr(e?.message || "No pudimos crear el apunte.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-nv my-4">
      <div className="section-card p-4 mb-3">
        <h1 className="nv-title fs-2 mb-1">Subir apunte</h1>
        <p className="nv-subtitle m-0">Completa los campos obligatorios y comparte tu material.</p>
      </div>

      <form className="nv-card p-4 d-grid gap-3" onSubmit={handleSubmit}>
        {err && (
          <div className="alert alert-danger py-2" role="alert">
            {err}
          </div>
        )}
        {ok && (
          <div className="alert alert-success py-2" role="status">
            Listo. Tu apunte quedó en revisión. ✅
          </div>
        )}

        <div className="row g-3">
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
              <option value="">— Selecciona —</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Año *</label>
            <input
              className="form-control"
              type="number"
              min={2018}
              max={2099}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2025"
              required
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Semestre *</label>
            <select
              className="form-select"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
            >
              <option value="">—</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Tema (sugerido)</label>
            <input
              className="form-control"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Se sugiere según título/asignatura"
            />
          </div>

          <div className="col-12">
            <label className="form-label">
              Descripción <span className="text-secondary">(opcional)</span>
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Resumen breve de tu apunte (opcional)…"
            />
          </div>

          <div className="col-12">
            <label className="form-label">Palabras clave (mínimo 1) *</label>
            <input
              className="form-control"
              placeholder="Separadas por coma: redes, control, resumen"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              required
            />
            <div className="form-text">Escribe al menos 1, separadas por coma.</div>
          </div>

          <div className="col-12">
            <label className="form-label">Archivo (PDF/JPG/PNG) *</label>
            <input
              className="form-control"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button className="btn btn-primary btn-pill" disabled={busy}>
            {busy ? "Subiendo…" : "Subir"}
          </button>
        </div>
      </form>
    </div>
  );
}
