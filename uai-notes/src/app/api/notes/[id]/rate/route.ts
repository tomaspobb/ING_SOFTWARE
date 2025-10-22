// src/app/api/notes/[id]/rate/route.ts
import { NextResponse } from "next/server";
import { dbConnect, Note, Rating } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  const { value } = await req.json().catch(() => ({}));
  const v = Number(value);

  if (!(v >= 1 && v <= 5)) {
    return NextResponse.json({ ok:false, error:"INVALID_VALUE" }, { status:400 });
  }

  await dbConnect();

  const session = await getServerSession(authOptions as any);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });

  // upsert rating del usuario para esta nota
  await Rating.updateOne(
    { noteId: id, userEmail: email },
    { $set: { value: v } },
    { upsert: true }
  );

  // recomputa promedio y conteo
  const agg = await Rating.aggregate([
    { $match: { noteId: (await import("mongoose")).default.Types.ObjectId.createFromHexString(id) } },
    { $group: { _id: null, avg: { $avg: "$value" }, cnt: { $sum: 1 } } }
  ]);

  const ratingAvg = agg?.[0]?.avg ?? 0;
  const ratingCount = agg?.[0]?.cnt ?? 0;

  await Note.updateOne({ _id: id }, { $set: { ratingAvg, ratingCount } });

  return NextResponse.json({ ok:true, data: { ratingAvg, ratingCount } });
}
