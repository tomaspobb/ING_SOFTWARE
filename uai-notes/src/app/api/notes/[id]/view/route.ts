// src/app/api/notes/[id]/view/route.ts
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
  subject: string;
  views: number;
};

const Note =
  (mongoose.models?.Note as mongoose.Model<TNote>) ??
  mongoose.model<TNote>(
    "Note",
    new Schema(
      {
        subject: { type: String, enum: SUBJECTS },
        views: { type: Number, default: 0 },
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
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, views: updated.views ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "VIEW_ERROR" }, { status: 500 });
  }
}
