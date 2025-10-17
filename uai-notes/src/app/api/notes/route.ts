import { NextRequest, NextResponse } from "next/server";
import mongoose, { Schema, model, models } from "mongoose";

// Asegura Node runtime (no edge) y respuesta sin cache
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ───────────────── DB connect (cache en dev) ───────────────── */
const MONGODB_URI = process.env.MONGODB_URI;

async function dbConnect() {
  if (!MONGODB_URI) {
    const err: any = new Error("MONGODB_URI missing");
    err.code = "NO_DB_URI";
    throw err;
  }
  const g = globalThis as any;
  if (!g._mongo) g._mongo = { conn: null, promise: null };
  if (g._mongo.conn) return g._mongo.conn;

  if (!g._mongo.promise) {
    g._mongo.promise = mongoose.connect(MONGODB_URI, {
      dbName: "notivium",       // DB lógica (sirve igual en Atlas/local)
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }
  g._mongo.conn = await g._mongo.promise;
  return g._mongo.conn;
}

/* ───────────────── Materias válidas (solo “azules” del malla) ───────────────── */
export const SUBJECTS: string[] = [
  "Minería de Datos",
  "Inteligencia Artificial",
  "Sistemas de Información",
  "Seguridad en TI",
  "Gestión de Proyectos Informáticos",
  "Lenguajes y Paradigmas de Programación",
  "Diseño de Software",
  "Programación Profesional",
  "Ingeniería de Software",
  "Estrategia TI",
  "Estructuras de Datos y Algoritmos",
  "Redes de Computadores",
  "Arquitectura de Sistemas",
  "Arquitectura Cloud",
  "Bases de Datos",
  "Sistemas Operativos",
];

/* ───────────────── Mongoose: Note ───────────────── */
type TNote = {
  title: string;
  description?: string;
  subject: string;     // ∈ SUBJECTS
  topic?: string;      // ej: “Grafos”, “Integrales”
  keywords?: string[]; // tags libres
  authorName?: string;
  authorEmail?: string;
  pdfUrl?: string;

  downloads: number;
  views: number;
  ratingAvg: number;   // 0..5
  ratingCount: number;
  moderated: boolean;

  createdAt: Date;
  updatedAt: Date;
};

const NoteSchema =
  models.Note ??
  model<TNote>(
    "Note",
    new Schema<TNote>(
      {
        title: { type: String, required: true, trim: true, index: true },
        description: { type: String, default: "" },
        subject: { type: String, required: true, enum: SUBJECTS, index: true },
        topic: { type: String, default: "", index: true },
        keywords: { type: [String], default: [], index: true },
        authorName: { type: String, default: "" },
        authorEmail: { type: String, default: "", index: true },
        pdfUrl: { type: String, default: "" },

        downloads: { type: Number, default: 0, index: true },
        views: { type: Number, default: 0, index: true },
        ratingAvg: { type: Number, default: 0, index: true },
        ratingCount: { type: Number, default: 0 },
        moderated: { type: Boolean, default: true, index: true },
      },
      { timestamps: true }
    ).index({
      // índice de búsqueda “tipo texto” simple
      title: "text",
      description: "text",
      topic: "text",
      keywords: "text",
    })
  );

const Note = NoteSchema as mongoose.Model<TNote>;

/* ───────────────── Helpers de filtro/sort ───────────────── */
function buildSearchQuery(params: URLSearchParams) {
  const q: any = {};
  // por defecto mostramos solo moderados
  const moderated =
    (params.get("moderated") ?? "true").toLowerCase() !== "false";
  if (moderated) q.moderated = true;

  const subject = params.get("subject");
  if (subject && SUBJECTS.includes(subject)) q.subject = subject;

  const topic = params.get("topic");
  if (topic) q.topic = { $regex: topic, $options: "i" };

  // texto libre
  const k = params.get("q");
  if (k) {
    const safe = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safe, "i");
    q.$or = [{ title: regex }, { description: regex }, { topic: regex }, { keywords: regex }];
  }
  return q;
}

function buildSort(params: URLSearchParams) {
  switch ((params.get("sort") ?? "recent").toLowerCase()) {
    case "downloads":
      return { downloads: -1, createdAt: -1 };
    case "rating":
      return { ratingAvg: -1, ratingCount: -1, createdAt: -1 };
    case "views":
      return { views: -1, createdAt: -1 };
    default:
      return { createdAt: -1 }; // “recent”
  }
}

/* ───────────────── GET /api/notes ─────────────────
  Query:
  - subject: string (∈ SUBJECTS)
  - topic: string
  - q: string (texto libre)
  - sort: recent|downloads|rating|views
  - limit: number (default 60, max 100)
  - moderated: "false" para ver todo (admin)
*/
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
  } catch {
    return NextResponse.json(
      { ok: false, error: "DB_UNAVAILABLE", data: [] },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = buildSearchQuery(searchParams);
  const sort = buildSort(searchParams);
  const limit = Math.min(parseInt(searchParams.get("limit") || "60", 10), 100);

  try {
    const items = await Note.find(query).sort(sort).limit(limit).lean();
    return NextResponse.json({ ok: true, data: items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "QUERY_ERROR", data: [] },
      { status: 500 }
    );
  }
}

/* ───────────────── POST /api/notes ─────────────────
   (semilla rápida para pruebas; luego haremos subida con PDF)
   Body JSON:
   { title, description, subject, topic, keywords[], authorName, authorEmail, pdfUrl }
*/
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
  } catch {
    return NextResponse.json(
      { ok: false, error: "DB_UNAVAILABLE" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body?.title || !body?.subject) {
      return NextResponse.json(
        { ok: false, error: "TITLE_AND_SUBJECT_REQUIRED" },
        { status: 400 }
      );
    }
    if (!SUBJECTS.includes(body.subject)) {
      return NextResponse.json(
        { ok: false, error: "SUBJECT_NOT_ALLOWED" },
        { status: 400 }
      );
    }

    const doc = await Note.create({
      title: String(body.title).trim(),
      description: String(body.description || ""),
      subject: String(body.subject),
      topic: String(body.topic || ""),
      keywords: Array.isArray(body.keywords)
        ? body.keywords.map((s: any) => String(s))
        : [],
      authorName: String(body.authorName || ""),
      authorEmail: String(body.authorEmail || ""),
      pdfUrl: String(body.pdfUrl || ""),
    });

    return NextResponse.json({ ok: true, data: doc }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
