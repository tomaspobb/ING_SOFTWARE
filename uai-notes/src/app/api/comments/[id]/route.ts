// src/app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect, Comment } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  const email = (session?.user?.email || "").toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { action } = await req.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
    }
    const doc = await Comment.findByIdAndUpdate(
      params.id,
      action === "approve"
        ? { $set: { moderated: true, rejected: false } }
        : { $set: { rejected: true, moderated: false } },
      { new: true }
    ).lean();

    if (!doc) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, data: doc });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "PATCH_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  const email = (session?.user?.email || "").toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    await dbConnect();
    await Comment.deleteOne({ _id: params.id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "DELETE_ERROR" }, { status: 500 });
  }
}
