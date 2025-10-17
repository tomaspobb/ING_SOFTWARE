import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Note from "@/lib/models/Note";

export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const note = await Note.findById(params.id).lean();
  if (!note) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: note });
}
