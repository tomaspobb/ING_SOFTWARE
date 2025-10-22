// src/app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect, Note, Rating, Comment } from "@/lib/models";
import { del as blobDel } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";

// helpers
const isOwner = (note: any, email: string | null) =>
  !!email && note?.authorEmail?.toLowerCase() === email.toLowerCase();

const isAdmin = (email: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());

// GET: detalle (visible si moderado, o si owner o admin)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    await dbConnect();
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    const note = await Note.findById(id).lean();
    if (!note) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const visible = note.moderated || isOwner(note, email) || isAdmin(email);
    if (!visible) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    return NextResponse.json({ ok: true, data: note });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "GET_ERROR" }, { status: 500 });
  }
}

// PATCH: aprobar (admin)
export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email ?? null)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    await dbConnect();
    const doc = await Note.findByIdAndUpdate(id, { $set: { moderated: true } }, { new: true }).lean();
    if (!doc) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ ok: true, data: doc });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "PATCH_ERROR" }, { status: 500 });
  }
}

// DELETE: borra apunte (propietario o admin). Borra Blob + ratings + comments.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    const note = await Note.findById(id).lean();
    if (!note) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    if (!isOwner(note, email) && !isAdmin(email)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    if (note.pdfUrl && BLOB_TOKEN) {
      try { await blobDel(note.pdfUrl, { token: BLOB_TOKEN }); } catch {}
    }

    await Promise.all([
      Rating.deleteMany({ noteId: id }),
      Comment.deleteMany({ noteId: id }),
      Note.deleteOne({ _id: id }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "DELETE_ERROR" }, { status: 500 });
  }
}
