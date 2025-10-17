import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Rating from "@/lib/models/Rating";
import Note from "@/lib/models/Note";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const session = await requireSession();

  const { value } = await req.json();
  const v = Math.max(1, Math.min(5, Number(value) || 0));

  await Rating.updateOne(
    { noteId: params.id, userEmail: session.user?.email },
    { $set: { value: v } },
    { upsert: true }
  );

  // Recalcular promedio y conteo
  const aggr = await Rating.aggregate([
    { $match: { noteId: new (require("mongoose").Types.ObjectId)(params.id) } },
    { $group: { _id: "$noteId", avg: { $avg: "$value" }, count: { $sum: 1 } } },
  ]);

  const stats = aggr[0] || { avg: 0, count: 0 };
  await Note.findByIdAndUpdate(params.id, {
    $set: { "stats.ratingAvg": stats.avg || 0, "stats.ratingCount": stats.count || 0 },
  });

  return NextResponse.json({ ok: true, avg: stats.avg || 0, count: stats.count || 0 });
}
