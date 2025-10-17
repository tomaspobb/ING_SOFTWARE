import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import { getOptionalSession, requireSession, isAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const session = await getOptionalSession();
  const isAdmin = isAdminSession(session);

  const where: any = { noteId: params.id };
  if (!isAdmin) where.state = "visible";

  const comments = await Comment.find(where).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, data: comments });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const session = await requireSession();
  const { text } = await req.json();

  const comment = await Comment.create({
    noteId: params.id,
    text: String(text || "").slice(0, 2000),
    author: { name: session.user?.name, email: session.user?.email },
    state: "visible", // si luego activas moderación previa -> "pending"
  });

  return NextResponse.json({ ok: true, data: comment }, { status: 201 });
}
