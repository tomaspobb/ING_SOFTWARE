import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect, Note } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: incrementa downloads y redirige al blob */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    await dbConnect();
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.redirect(new URL("/404", process.env.NEXT_PUBLIC_BASE_URL), 302);
    }

    const note = await Note.findById(id).lean();
    if (!note || !note.pdfUrl) {
      return NextResponse.redirect(new URL("/404", process.env.NEXT_PUBLIC_BASE_URL), 302);
    }

    await Note.updateOne({ _id: id }, { $inc: { downloads: 1 } });
    return NextResponse.redirect(note.pdfUrl, 302);
  } catch {
    return NextResponse.redirect(new URL("/500", process.env.NEXT_PUBLIC_BASE_URL), 302);
  }
}
