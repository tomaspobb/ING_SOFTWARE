import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect, Comment } from "@/lib/models";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

const isAdmin = (email: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email ?? null)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const body = await req.json();
    const approve = Boolean(body?.approve);

    const doc = await Comment.findByIdAndUpdate(id, { $set: { moderated: approve } }, { new: true }).lean();
    if (!doc) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ ok: true, data: doc });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "PATCH_COMMENT_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email ?? null)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    await Comment.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "DELETE_COMMENT_ERROR" }, { status: 500 });
  }
}
