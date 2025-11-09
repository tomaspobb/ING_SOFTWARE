import { NextResponse } from "next/server";
import { dbConnect, Rating, Note, toObjectId } from "@/lib/models";
import mongoose from "mongoose";

// NextAuth (ajusta a tu proyecto)
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const value = Number(body?.value);

  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return NextResponse.json({ error: "INVALID_VALUE" }, { status: 400 });
  }

  try {
    await dbConnect();
    const oid = toObjectId(params.id);
    if (!oid) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });

    // usuario
    const session = await getServerSession(authOptions as any);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    // Upsert del voto
    await Rating.updateOne(
      { noteId: oid, userEmail: email },
      { $set: { value } },
      { upsert: true }
    );

    // Recalcular promedio y count de la nota
    const agg = await Rating.aggregate<{ _id: mongoose.Types.ObjectId; avg: number; cnt: number }>([
      { $match: { noteId: oid } },
      { $group: { _id: "$noteId", avg: { $avg: "$value" }, cnt: { $sum: 1 } } },
    ]);

    const avg = agg[0]?.avg ?? 0;
    const cnt = agg[0]?.cnt ?? 0;

    await Note.updateOne({ _id: oid }, { $set: { ratingAvg: avg, ratingCount: cnt } });

    return NextResponse.json({ ok: true, ratingAvg: avg, ratingCount: cnt }, { status: 200 });
  } catch (e) {
    console.error("RATE_ERROR", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
