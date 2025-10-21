// src/app/api/notes/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Schema } from "mongoose";
import { SUBJECTS } from "@/lib/subjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.MONGODB_URI;

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

type TNote = {
  pdfUrl?: string;
  downloads: number;
};

const Note =
  (mongoose.models?.Note as mongoose.Model<TNote>) ??
  mongoose.model<TNote>(
    "Note",
    new Schema(
      {
        pdfUrl: String,
        downloads: { type: Number, default: 0 },
      },
      { strict: false }
    )
  );

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
  } catch {
    return NextResponse.json({ ok: false, error: "DB_UNAVAILABLE" }, { status: 503 });
  }

  try {
    const updated = await Note.findByIdAndUpdate(
      params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    ).lean();

    if (!updated) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, downloads: updated.downloads ?? 0, pdfUrl: updated.pdfUrl || "" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "DOWNLOAD_ERROR" }, { status: 500 });
  }
}
