// src/app/api/notes/[id]/rate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect, Note, Rating } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const email = session.user.email!.toLowerCase();

    const body = await req.json();
    const value = Number(body?.value);
    if (![1,2,3,4,5].includes(value)) {
      return NextResponse.json({ ok: false, error: "INVALID_VALUE" }, { status: 400 });
    }

    await dbConnect();
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }
    const note = await Note.findById(params.id);
    if (!note) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    // upsert rating
    await Rating.findOneAndUpdate(
      { noteId: note._id, userEmail: email },
      { $set: { value } },
      { upsert: true, new: true }
    );

    // recompute aggregate
    const agg = await Rating.aggregate([
      { $match: { noteId: note._id } },
      { $group: { _id: "$noteId", avg: { $avg: "$value" }, count: { $sum: 1 } } },
      { $project: { _id: 0, avg: { $round: ["$avg", 2] }, count: 1 } }
    ]);

    const ratingAvg = agg[0]?.avg ?? 0;
    const ratingCount = agg[0]?.count ?? 0;
    note.ratingAvg = ratingAvg;
    note.ratingCount = ratingCount;
    await note.save();

    return NextResponse.json({ ok: true, data: { ratingAvg, ratingCount } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "RATE_ERROR" },
      { status: 500 }
    );
  }
}
