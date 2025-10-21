import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

// estas 2 importaciones deben existir igual que en /api/notes/route
import { SUBJECTS } from "@/lib/subjects";
const MONGODB_URI = process.env.MONGODB_URI;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── DB connect (mismo helper que usas en /api/notes) ─────────────────
async function dbConnect() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
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

// usa el mismo schema/model que el de /api/notes/route
type TNote = {
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
  createdAt: Date;
  updatedAt: Date;
};

const Note =
  (mongoose.models?.Note as mongoose.Model<TNote>) ??
  mongoose.model<TNote>(
    "Note",
    new mongoose.Schema<TNote>(
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        subject: { type: String, required: true, enum: SUBJECTS },
        topic: { type: String, default: "" },
        keywords: { type: [String], default: [] },
        year: Number,
        semester: Number,
        authorName: { type: String, default: "" },
        authorEmail: { type: String, default: "" },
        pdfUrl: { type: String, default: "" },
        downloads: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        ratingAvg: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        moderated: { type: Boolean, default: false },
      },
      { timestamps: true }
    )
  );

// GET /api/notes/:id  → devuelve la nota (aunque no esté moderada)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const note = await Note.findById(params.id).lean();
    if (!note) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: note });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "GET_ERROR" },
      { status: 500 }
    );
  }
}
