import { NextRequest, NextResponse } from "next/server";
import { dbConnect, Comment } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

function assertAdmin(email?: string | null) {
  return !!(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: lista comentarios en cola (moderated:false) */
export async function GET() {
  try {
    await dbConnect();
    const data = await Comment.find({ moderated: false })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "GET_QUEUE_ERROR" }, { status: 500 });
  }
}

/** PATCH: aprobar comentario */
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions as any);
    if (!assertAdmin(session?.user?.email)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "ID_REQUIRED" }, { status: 400 });

    const doc = await Comment.findByIdAndUpdate(id, { $set: { moderated: true } }, { new: true }).lean();
    if (!doc) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, data: doc });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "PATCH_ERROR" }, { status: 500 });
  }
}

/** DELETE: rechazar / borrar comentario de la cola */
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions as any);
    if (!assertAdmin(session?.user?.email)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "ID_REQUIRED" }, { status: 400 });

    await Comment.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "DELETE_ERROR" }, { status: 500 });
  }
}
