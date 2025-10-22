import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect, Note } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    await dbConnect();
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }
    const doc = await Note.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean();
    if (!doc) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ ok: true, data: { views: doc.views } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "VIEW_ERROR" }, { status: 500 });
  }
}
