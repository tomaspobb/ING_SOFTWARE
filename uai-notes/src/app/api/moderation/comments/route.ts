// src/app/api/moderation/comments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect, Comment } from "@/lib/models";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(s=>s.trim().toLowerCase());

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });
  }
  await dbConnect();
  const items = await Comment.find({ moderated:false }).sort({ createdAt:1 }).lean();
  return NextResponse.json({ ok:true, data:items });
}
