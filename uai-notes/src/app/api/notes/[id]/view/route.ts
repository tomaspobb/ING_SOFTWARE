import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Note from "@/lib/models/Note";
export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  await Note.findByIdAndUpdate(params.id, { $inc: { "stats.views": 1 } });
  return NextResponse.json({ ok: true });
}
