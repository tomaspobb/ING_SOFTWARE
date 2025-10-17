import { NextRequest, NextResponse } from "next/server";
import mongoose, { Schema, models, model } from "mongoose";

/** ========= DB connect (cache global para dev hot-reload) ========= */
const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI no definido. El API responderá 503.");
}

async function dbConnect() {
  if (!MONGODB_URI) throw new Error("NO_DB_URI");
  // cache en globalThis para no reconectar en cada request
  const g = globalThis as any;
  if (!g._mongo) g._mongo = { conn: null, promise: null };

  if (g._mongo.conn) return g._mongo.conn;

  if (!g._mongo.promise) {
    g._mongo.promise = mongoose.connect(MONGODB_URI, {
      dbName: "notivium",
      bufferCommands: false,
    });
  }
  g._mongo.conn = await g._mongo.promise;
  return g._mongo.conn;
}

/** ========= Materias válidas (desde tu imagen, solo azules) ========= */
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

/** ========= Mongoose Note ========= */
type TNote = {
  title: string;
  description?: string;
  subject: string;         // debe ser uno de SUBJECTS
  topic?: string;          // ej: "Integrales", "Grafos"
  keywords?: string[];     // tags libres
  authorName?: string;
  authorEmail?: string;
  pdfUrl?: string;

  downloads: number;
  views: number;
  ratingAvg: number;       // 0..5
  ratingCount: number;
  moderated: boolean;

  createdAt: Date;
  updatedAt: Date;
};

const NoteSchema =
  models.Note ||
  model<TNote>(
    "Note",
    new Schema<TNote>(
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        subject: {
          type: String,
          required: true,
          enum: SUBJECTS,
        },
        topic: { type: String, default: "" },
        keywords: { type: [String], default: [] },
        authorName: String,
        authorEmail: String,
        pdfUrl: String,

        downloads: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        ratingAvg: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        moderated: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  );

const Note = NoteSchema as mongoose.Model<TNote>;

/** ========= Helpers de filtro ========= */
function buildSearchQuery(params: URLSearchParams) {
  const q: any = {};
  // solo mostrar moderados (por defecto sí)
  const moderated = (params.get("moderated") ?? "true").toLowerCase() !== "false";
  if (moderated) q.moderated = true;

  const subject = params.get("subject");
  if (subject && SUBJECTS.includes(subject)) q.subject = subject;

  // topic exacto (o contiene)
  const topic = params.get("topic");
  if (topic) q.topic = { $regex: topic, $options: "i" };

  // keywords / texto libre
  const k = params.get("q");
  if (k) {
    const regex = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    q.$or = [
      { title: regex },
      { description: regex },
      { topic: regex },
      { keywords: regex },
    ];
  }
  return q;
}

function buildSort(params: URLSearchParams) {
  const sort = (params.get("sort") ?? "recent").toLowerCase();
  switch (sort) {
    case "downloads":
      return { downloads: -1, createdAt: -1 };
    case "rating":
      return { ratingAvg: -1, ratingCount: -1 };
    case "views":
      return { views: -1 };
    default:
      return { createdAt: -1 };
  }
}

/** ========= GET /api/notes =========
 *  Query:
 *   - subject: string (de SUBJECTS)
 *   - topic: string
 *   - q: string (keywords texto)
 *   - sort: recent|downloads|rating|views
 *   - limit: number (default 60, máx 100)
 *   - moderated: "false" para ver todo (admin)
 */
export async function GET(req: NextRequest) {
  // Conexión segura
  try {
    await dbConnect();
  } catch {
    // No revientes el front: devuelve 503 con JSON
    return NextResponse.json(
      { ok: false, error: "DB_UNAVAILABLE", data: [] },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = buildSearchQuery(searchParams);
  const sort = buildSort(searchParams);
  const limit = Math.min(parseInt(searchParams.get("limit") || "60", 10), 100);

  try {
    const items = await Note.find(q).sort(sort).limit(limit).lean();
    return NextResponse.json({ ok: true, data: items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "QUERY_ERROR", data: [] },
      { status: 500 }
    );
  }
}

/** ========= POST /api/notes =========
 *  Mini “subida” para pruebas desde el front o Thunder client.
 *  Body JSON:
 *  {
 *    title, description, subject, topic, keywords[], authorName, authorEmail, pdfUrl
 *  }
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
    const body = await req.json();
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
      subject: body.subject,
      topic: String(body.topic || ""),
      keywords: Array.isArray(body.keywords)
        ? body.keywords.map((s: any) => String(s))
        : [],
      authorName: body.authorName || "",
      authorEmail: body.authorEmail || "",
      pdfUrl: body.pdfUrl || "",
    });

    return NextResponse.json({ ok: true, data: doc }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
