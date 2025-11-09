import { NextResponse } from "next/server";
import { dbConnect, Comment, toObjectId } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BLOCKED = ["weon", "weona", "culiao", "ql", "ctm", "ctmre", "weón", "hueon", "hueón"];

export const runtime = "nodejs";

/** GET: comentarios aprobados */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });

    await dbConnect();
    const items = await Comment.find({ noteId: oid, moderated: true })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ items }, { status: 200 });
  } catch (e) {
    console.error("COMMENTS_GET_ERROR", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

/** POST: crear comentario (con moderación si hay palabrotas) */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });

    const session = await getServerSession(authOptions as any);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const text = (body?.text ?? "").toString().trim();
    if (!text) return NextResponse.json({ error: "EMPTY" }, { status: 400 });

    await dbConnect();

    const lower = text.toLowerCase();
    const hasBlocked = BLOCKED.some((w) => lower.includes(w));
    const moderated = !hasBlocked;

    const doc = await Comment.create({
      noteId: oid,
      userEmail: email,
      userName: session?.user?.name || email.split("@")[0],
      text,
      moderated,
    });

    // Si moderado=false => pendiente de revisión (no aparece en la lista de GET)
    return NextResponse.json(
      { item: doc.toObject(), moderated },
      { status: 201 }
    );
  } catch (e) {
    console.error("COMMENTS_POST_ERROR", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

/** DELETE: editor o autor del comentario */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });

    const url = new URL(req.url);
    const commentId = toObjectId(url.searchParams.get("commentId") || "");
    if (!commentId) {
      return NextResponse.json({ error: "INVALID_COMMENT_ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions as any);
    const email = session?.user?.email || "";
    const isEditor = Boolean((session as any)?.user?.isEditor || (session as any)?.user?.role === "admin");
    if (!email) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    await dbConnect();

    // ¿Es editor o autor?
    const own = await Comment.findOne({ _id: commentId, noteId: oid, userEmail: email }).lean();
    if (!isEditor && !own) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const result = await Comment.deleteOne({ _id: commentId, noteId: oid });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("COMMENTS_DELETE_ERROR", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
