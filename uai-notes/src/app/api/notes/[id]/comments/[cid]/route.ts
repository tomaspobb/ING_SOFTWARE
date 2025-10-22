// src/app/api/comments/[cid]/route.ts  (borrado por ADMIN)
import { NextResponse } from "next/server";
import { dbConnect, Comment } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_: Request, { params }: { params: Promise<{ cid: string }>}) {
  const { cid } = await params;
  await dbConnect();

  const session = await getServerSession(authOptions as any);
  const email = (session?.user?.email || "").toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });
  }

  await Comment.deleteOne({ _id: cid });
  return NextResponse.json({ ok:true });
}
