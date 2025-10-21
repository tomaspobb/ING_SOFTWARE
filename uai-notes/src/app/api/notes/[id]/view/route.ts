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

// usando el mismo modelo ya inicializado por mongoose
const Note = () => mongoose.models.Note as mongoose.Model<any>;

// POST /api/notes/:id/view  → +1 vista
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const res = await Note().findByIdAndUpdate(
      params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!res) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "VIEW_ERROR" },
      { status: 500 }
    );
  }
}

// (opcional) proteger otros métodos para evitar 405 en el navegador
export function GET() {
  return NextResponse.json({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
