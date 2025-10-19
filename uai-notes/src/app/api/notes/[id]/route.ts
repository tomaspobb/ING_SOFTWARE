// src/app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose, { isValidObjectId } from "mongoose";
import { SUBJECTS } from "@/lib/subjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.MONGODB_URI!;
const g = globalThis as any;

function getNoteModel() {
  if (!g._noteModel) {
    const NoteSchema = new mongoose.Schema(
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

        year: Number,
        semester: Number,
      },
      { timestamps: true }
    );
    g._noteModel = mongoose.models.Note || mongoose.model("Note", NoteSchema);
  }
  return g._noteModel as mongoose.Model<any>;
}

async function db() {
  if (!g._mongo) g._mongo = { conn: null, promise: null };
  if (!g._mongo.conn) {
    g._mongo.promise = mongoose.connect(MONGODB_URI, {
      dbName: "notivium",
      bufferCommands: false,
    });
    g._mongo.conn = await g._mongo.promise;
  }
  return g._mongo.conn;
}

// GET /api/notes/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  try {
    await db();
  } catch {
    return NextResponse.json({ ok: false, error: "DB_UNAVAILABLE" }, { status: 503 });
  }

  const Note = getNoteModel();
  const doc = await Note.findById(id).lean();

  if (!doc) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: doc });
}
