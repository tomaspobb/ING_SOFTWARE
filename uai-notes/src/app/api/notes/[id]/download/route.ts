import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const Note = () => mongoose.models.Note as mongoose.Model<any>;

// GET /api/notes/:id/download  → +1 descarga y redirige al pdfUrl
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const updated = await Note().findByIdAndUpdate(
      params.id,
      { $inc: { downloads: 1 } },
      { new: true, projection: { pdfUrl: 1 } }
    ).lean();

    if (!updated || !updated.pdfUrl) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.redirect(updated.pdfUrl);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "DOWNLOAD_ERROR" },
      { status: 500 }
    );
  }
}
