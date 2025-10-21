// src/app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SUBJECTS } from "@/lib/subjects";
import { del as blobDel } from "@vercel/blob";
import { dbConnect, Note, Rating, Comment } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

/** Helpers */
function isAdmin(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
function isOwner(note: any, email?: string | null) {
  return !!email && note?.authorEmail?.toLowerCase() === email.toLowerCase();
}

/** GET => detalle con control de visibilidad */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    const note = await Note.findById(params.id).lean();
    if (!note) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const visible = note.moderated || isOwner(note, email) || isAdmin(email);
    if (!visible) {
      // Para usuarios no autorizados, se comporta como no encontrado
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: note });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "GET_ERROR" }, { status: 500 });
  }
}

/** PATCH => aprobar (admin) */
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const doc = await Note.findByIdAndUpdate(
      params.id,
      { $set: { moderated: true } },
      { new: true }
    ).lean();

    if (!doc) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, data: doc });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "PATCH_ERROR" }, { status: 500 });
  }
}

/** DELETE => borrar (autor o admin) + cascada + blob */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    const note = await Note.findById(params.id).lean();
    if (!note) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const canDelete = isOwner(note, email) || isAdmin(email);
    if (!canDelete) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // borrar blob (si existe)
    if (note.pdfUrl && BLOB_TOKEN) {
      try { await blobDel(note.pdfUrl, { token: BLOB_TOKEN }); }
      catch (e) { console.warn("Blob delete warning:", (e as any)?.message || e); }
    }

    // borrar cascada (ratings + comments)
    await Promise.all([
      Rating.deleteMany({ noteId: new mongoose.Types.ObjectId(params.id) }),
      Comment.deleteMany({ noteId: new mongoose.Types.ObjectId(params.id) }),
      Note.deleteOne({ _id: params.id }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "DELETE_ERROR" }, { status: 500 });
  }
}
