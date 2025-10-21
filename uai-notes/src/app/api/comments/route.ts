import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Comment, Note } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { needsModeration, ALWAYS_MODERATE_COMMENTS } from "@/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.MONGODB_URI!;
async function dbConnect() {
  const g = globalThis as any;
  if (!g._mongo) g._mongo = { conn:null, promise:null };
  if (g._mongo.conn) return g._mongo.conn;
  g._mongo.promise = mongoose.connect(MONGODB_URI, { dbName:"notivium", bufferCommands:false });
  g._mongo.conn = await g._mongo.promise; return g._mongo.conn;
}

export async function GET(req: NextRequest) {
  try { await dbConnect(); } catch { return NextResponse.json({ ok:false, error:"DB_UNAVAILABLE", data:[] }, { status:503 }); }
  const sp = new URL(req.url).searchParams;
  const noteId = sp.get("noteId");
  if (!noteId) return NextResponse.json({ ok:false, error:"NOTE_REQUIRED", data:[] }, { status:400 });

  const list = await Comment.find({ noteId, moderated: true, rejected: { $ne: true } })
    .sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok:true, data:list });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });

  try { await dbConnect(); } catch { return NextResponse.json({ ok:false, error:"DB_UNAVAILABLE" }, { status:503 }); }

  const body = await req.json();
  const { noteId, text } = body ?? {};
  if (!noteId || !text?.trim()) return NextResponse.json({ ok:false, error:"INVALID" }, { status:400 });

  // comprueba que la nota exista y no esté rechazada
  const note = await Note.findById(noteId).lean();
  if (!note || note.rejected) return NextResponse.json({ ok:false, error:"NOTE_NOT_FOUND" }, { status:404 });

  const moderated = !(ALWAYS_MODERATE_COMMENTS || needsModeration(text));
  const newDoc = await Comment.create({
    noteId,
    text: String(text).trim(),
    userEmail: session.user.email!,
    userName: session.user.name || "",
    moderated,
    rejected: false,
  });

  return NextResponse.json({ ok:true, data:newDoc, moderated }, { status:201 });
}
