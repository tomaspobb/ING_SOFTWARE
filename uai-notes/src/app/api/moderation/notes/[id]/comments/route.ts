import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect, Comment } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// lista rápida de palabras a moderar (puedes mover a config)
const BAD_WORDS = ["hoyo", "weon", "tonto", "imbecil", "puta", "ql"];

/** GET visibles */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params; // 👈
  try {
    await dbConnect();
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }
    const comments = await Comment.find({ noteId: id, moderated: true })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ ok: true, data: comments });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "GET_ERROR" }, { status: 500 });
  }
}

/** POST nuevo comentario (queda moderado si detectamos palabra prohibida) */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params; // 👈
  try {
    await dbConnect();

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const name = session?.user?.name;

    if (!email) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || "").trim();
    if (!text) return NextResponse.json({ ok: false, error: "EMPTY_TEXT" }, { status: 400 });

    const lower = text.toLowerCase();
    const needsReview = BAD_WORDS.some((w) => lower.includes(w));

    const created = await Comment.create({
      noteId: new mongoose.Types.ObjectId(id),
      userEmail: email,
      userName: name,
      text,
      moderated: !needsReview, // si contiene malas palabras -> queda en cola
    });

    return NextResponse.json({ ok: true, data: created.toObject() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "POST_ERROR" }, { status: 500 });
  }
}
