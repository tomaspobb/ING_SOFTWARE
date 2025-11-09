import { NextRequest, NextResponse } from "next/server";
import { dbConnect, Comment, toObjectId } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isEditor(email?: string | null): boolean {
  if (!email) return false;
  const allow = (process.env.EDITORS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (allow.length === 0) return false; // por seguridad
  return allow.includes(email.toLowerCase());
}

export const runtime = "nodejs";

// DELETE /api/moderation/comments/[cid]
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ cid: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isEditor(session?.user?.email)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { cid } = await ctx.params;
    const oid = toObjectId(cid);
    if (!oid) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });

    await dbConnect();

    // Soft delete: marcar como rechazado y no moderado
    await Comment.findByIdAndUpdate(oid, { $set: { rejected: true, moderated: false } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("COMMENT_DELETE_ERROR", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
