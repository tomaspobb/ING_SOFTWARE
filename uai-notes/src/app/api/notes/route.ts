// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Schema } from "mongoose";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";                 // <-- ajusta si tu archivo está en otra ruta
import { SUBJECTS } from "@/lib/subjects";            // 16 asignaturas (azules)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ───────────────────── DB connect (cache global) ───────────────────── */
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
      dbName: "notivium",
      bufferCommands: false,
    });
  }
  g._mongo.conn = await g._mongo.promise;
  return g._mongo.conn;
}

/* ─────────────────────────── Tipos + Schema ─────────────────────────── */
type TNote = {
  title: string;
  description?: string;
  subject: string;      // enum SUBJECTS
  topic?: string;
  keywords?: string[];

  year?: number;        // plano (no meta.year)
  semester?: number;    // 1 | 2

  authorName?: string;
  authorEmail?: string;

  pdfUrl?: string;

  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  moderated: boolean;

  createdAt: Date;
  updatedAt: Date;
};

// Usa mongoose.models para evitar undefined en hot reload/build
const Note =
  (mongoose.models?.Note as mongoose.Model<TNote>) ??
  mongoose.model<TNote>(
    "Note",
    new Schema<TNote>(
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },

        subject: { type: String, required: true, enum: SUBJECTS },
        topic: { type: String, default: "" },
        keywords: { type: [String], default: [] },

        year: { type: Number },          // ej: 2025
        semester: { type: Number },      // 1 o 2

        authorName: { type: String, default: "" },
        authorEmail: { type: String, default: "" },

        pdfUrl: { type: String, default: "" },

        downloads: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        ratingAvg: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },

        // por defecto, todo entra a cola de moderación
        moderated: { type: Boolean, default: false },
      },
      { timestamps: true }
    )
  );

/* ───────────────────────── Helpers de filtro ───────────────────────── */
function buildSearchQuery(params: URLSearchParams) {
  const q: any = {};

  // por defecto mostramos sólo moderados (a menos que ?moderated=false)
  const moderated = (params.get("moderated") ?? "true").toLowerCase() !== "false";
  if (moderated) q.moderated = true;

  const subject = params.get("subject");
  if (subject && SUBJECTS.includes(subject)) q.subject = subject;

  const topic = params.get("topic");
  if (topic) q.topic = { $regex: topic, $options: "i" };

  // texto libre
  const k = params.get("q");
  if (k) {
    const regex = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    q.$or = [{ title: regex }, { description: regex }, { topic: regex }, { keywords: regex }];
  }

  const year = params.get("year");
  if (year) q.year = Number(year);

  const semester = params.get("semester");
  if (semester) q.semester = Number(semester);

  return q;
}

function buildSort(params: URLSearchParams) {
  switch ((params.get("sort") ?? "recent").toLowerCase()) {
    case "downloads":
      return { downloads: -1, createdAt: -1 };
    case "rating":
      return { ratingAvg: -1, ratingCount: -1 };
    case "views":
      return { views: -1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
}

/* ────────────────────────── GET /api/notes ─────────────────────────── */
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

/* ────────────────────────── POST /api/notes ──────────────────────────
 * Crea una nota: { title, description, subject, topic, keywords[], year, semester, pdfUrl }
 * authorName/authorEmail se toman de la sesión si existen.
 * moderated=false (cola de revisión).
 * -------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
  } catch {
    return NextResponse.json({ ok: false, error: "DB_UNAVAILABLE" }, { status: 503 });
  }

  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const title = String(body?.title || "").trim();
    const subject = String(body?.subject || "");
    const pdfUrl = String(body?.pdfUrl || "");

    if (!title || !subject || !pdfUrl) {
      return NextResponse.json(
        { ok: false, error: "TITLE_SUBJECT_PDF_REQUIRED" },
        { status: 400 }
      );
    }

    if (!SUBJECTS.includes(subject)) {
      return NextResponse.json(
        { ok: false, error: "SUBJECT_NOT_ALLOWED" },
        { status: 400 }
      );
    }

    const doc = await Note.create({
      title,
      description: String(body.description || ""),
      subject,
      topic: String(body.topic || ""),
      keywords: Array.isArray(body.keywords)
        ? body.keywords.map((s: any) => String(s))
        : String(body.keywords || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),

      year: body.year ? Number(body.year) : undefined,
      semester: body.semester ? Number(body.semester) : undefined,

      authorName: session?.user?.name || String(body.authorName || ""),
      authorEmail: session?.user?.email || String(body.authorEmail || ""),

      pdfUrl,
      // moderated queda en false por default (schema)
    });

    return NextResponse.json({ ok: true, data: doc }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
