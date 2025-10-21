// src/app/api/notes/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect, Comment, Note } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// lista MUY corta de ejemplo (puedes moverla a un archivo)
const BAD_WORDS = ["weon", "qlo", "ctm", "ql", "mierda", "imbecil"];

function needsModeration(text: string) {
  const t = text.toLowerCase();
  return BAD_WORDS.some((w) => t.includes(w));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }
    // solo comentarios aprobados
    const comments = await Comment.find({ noteId: params.id, moderated: true })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ ok: true, data: comments });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "COMMENTS_LIST_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const text = String(body?.text || "").trim();
    if (!text) {
      return NextResponse.json({ ok: false, error: "EMPTY_TEXT" }, { status: 400 });
    }

    await dbConnect();
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }
    const note = await Note.findById(params.id);
    if (!note) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const moderated = !needsModeration(text); // true => visible
    const created = await Comment.create({
      noteId: note._id,
      userEmail: session.user.email!.toLowerCase(),
      userName: session.user.name || "",
      text,
      moderated,
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "COMMENT_CREATE_ERROR" },
      { status: 500 }
    );
  }
}
