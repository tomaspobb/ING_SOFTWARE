// src/app/api/notes/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { dbConnect, Comment } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasBadWords } from "@/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  await dbConnect();
  const items = await Comment.find({ noteId: id, moderated: true })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return NextResponse.json({ ok:true, data:items });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || "").trim();
  if (!text) return NextResponse.json({ ok:false, error:"EMPTY" }, { status:400 });

  await dbConnect();
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.email) return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });

  const moderated = !hasBadWords(text); // si tiene insultos => queda sin aprobar
  const doc = await Comment.create({
    noteId: id,
    userEmail: session.user.email,
    userName: session.user.name || "",
    text,
    moderated,
  });

  return NextResponse.json({ ok:true, data: doc });
}
