import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect, Note, TNote } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((x) => x.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
function isOwner(note: TNote, email?: string | null) {
  if (!email || !note?.authorEmail) return false;
  return note.authorEmail.toLowerCase() === email.toLowerCase();
}

/** GET /api/notes/[id]  -> devuelve la ficha, controlando visibilidad */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params; // 👈 Next 15: params es Promise
  try {
    await dbConnect();
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    const note = await Note.findById(id).lean<TNote>();
    if (!note) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const visible = note.moderated || isOwner(note, email) || isAdmin(email);
    if (!visible) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // sumar 1 view (no es crítico si falla)
    Note.updateOne({ _id: id }, { $inc: { views: 1 } }).catch(() => {});

    return NextResponse.json({ ok: true, data: note });
  } catch (e: any) {
    const msg = e?.message || "GET_ERROR";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** PATCH /api/notes/[id]  -> aprobar (admin) */
export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email ?? null)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }

    const doc = await Note.findByIdAndUpdate(id, { $set: { moderated: true } }, { new: true }).lean();
    if (!doc) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, data: doc });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "PATCH_ERROR" }, { status: 500 });
  }
}

/** DELETE /api/notes/[id]  -> rechazar/borrar (admin) */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email ?? null)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }

    const doc = await Note.findById(id).lean<TNote>();
    if (!doc) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    // si tienes RW token y quieres borrar el blob aquí, puedes hacerlo como ya tenías:
    // import { del as blobDel } from "@vercel/blob"
    // await blobDel(doc.pdfUrl!, { token: process.env.BLOB_READ_WRITE_TOKEN! }).catch(()=>{});

    await Note.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "DELETE_ERROR" }, { status: 500 });
  }
}
