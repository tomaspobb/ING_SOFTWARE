// src/app/api/notes/[id]/my-rating/route.ts
import { NextResponse } from "next/server";
import { dbConnect, Rating, toObjectId } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;         // ✅
    const oid = toObjectId(id);
    if (!oid) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });

    await dbConnect();

    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) return NextResponse.json({ rating: null }, { status: 200 });

    const doc = await Rating.findOne({ noteId: oid, userEmail: email })
      .select("value")
      .lean();

    return NextResponse.json({ rating: doc ? { value: doc.value } : null }, { status: 200 });
  } catch (e) {
    console.error("MY_RATING_ERROR", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
