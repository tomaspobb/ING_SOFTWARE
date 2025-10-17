import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Report from "@/lib/models/Report";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await requireSession();

  const body = await req.json();
  const rep = await Report.create({
    targetType: body.targetType, // "note" | "comment"
    targetId: body.targetId,
    reason: String(body.reason || "").slice(0, 2000),
    by: { name: session.user?.name, email: session.user?.email },
    status: "open",
  });

  return NextResponse.json({ ok: true, data: rep }, { status: 201 });
}
