// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Schema } from "mongoose";
import { SUBJECTS } from "@/lib/subjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------- DB connect con cache global ---------------- */
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

/* ---------------- Tipos + Schema ---------------- */
type TNote = {
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  keywords?: string[];
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

// ⚠️ NO uses `models` importado. En server usa `mongoose.models`,
// que existe tras el connect. Así evitas `undefined` en builds.
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

/* ---------------- Helpers de query ---------------- */
function buildSearchQuery(params: URLSearchParams) {
  const q: any = {};
  const moderated = (params.get("moderated") ?? "true").toLowerCase() !== "false";
  if (moderated) q.moderated = true;

  const subject = params.get("subject");
  if (subject && SUBJECTS.includes(subject as any)) q.subject = subject;

  const topic = params.get("topic");
  if (topic) q.topic = { $regex: topic, $options: "i" };

  const k = params.get("q");
  if (k) {
    const regex = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    q.$or = [{ title: regex }, { description: regex }, { topic: regex }, { keywords: regex }];
  }

  const year = params.get("year");
  if (year) q["meta.year"] = Number(year);

  const semester = params.get("semester");
  if (semester) q["meta.semester"] = Number(semester);

  return q;
}

function buildSort(params: URLSearchParams) {
  switch ((params.get("sort") ?? "recent").toLowerCase()) {
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

/* ---------------- GET /api/notes ---------------- */
export async function GET(req: NextRequest) {
  // Nunca se ejecuta en el cliente; si importas esto en un componente,
  // forzarás el bundle en el browser (y explotará). Evítalo.
  try {
    await dbConnect();
  } catch {
    return NextResponse.json({ ok: false, error: "DB_UNAVAILABLE", data: [] }, { status: 503 });
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

/* ---------------- POST /api/notes ---------------- */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
  } catch {
    return NextResponse.json({ ok: false, error: "DB_UNAVAILABLE" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { title, subject } = body ?? {};
    if (!title || !subject)
      return NextResponse.json(
        { ok: false, error: "TITLE_AND_SUBJECT_REQUIRED" },
        { status: 400 }
      );

    if (!SUBJECTS.includes(subject))
      return NextResponse.json({ ok: false, error: "SUBJECT_NOT_ALLOWED" }, { status: 400 });

    const doc = await Note.create({
      title: String(title).trim(),
      description: String(body.description || ""),
      subject,
      topic: String(body.topic || ""),
      keywords: Array.isArray(body.keywords) ? body.keywords.map(String) : [],
      authorName: body.authorName || "",
      authorEmail: body.authorEmail || "",
      pdfUrl: body.pdfUrl || "",
      // Si luego agregas más metadatos (year, semester, etc.) puedes anidarlos en "meta"
      meta: {
        year: Number(body.meta?.year) || undefined,
        semester: Number(body.meta?.semester) || undefined,
      },
    });

    return NextResponse.json({ ok: true, data: doc }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "CREATE_ERROR" },
      { status: 500 }
    );
  }
}
