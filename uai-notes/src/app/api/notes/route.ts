import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Note from "@/lib/models/Note";
import { requireSession, getOptionalSession, isAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await dbConnect();

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const subject = url.searchParams.get("subject") || "";
  const topic = url.searchParams.get("topic") || "";
  const semester = url.searchParams.get("semester") || "";
  const sort = url.searchParams.get("sort") || "recent"; // recent|downloads|rating

  const session = await getOptionalSession();
  const isAdmin = isAdminSession(session);

  const where: any = {};
  if (q) where.$text = { $search: q };
  if (subject) where.subject = subject;
  if (topic) where.topic = topic;
  if (semester) where.semester = semester;
  if (!isAdmin) where["moderation.state"] = "published";

  const sortMap: Record<string, any> = {
    recent: { createdAt: -1 },
    downloads: { "stats.downloads": -1 },
    rating: { "stats.ratingAvg": -1, "stats.ratingCount": -1 },
  };

  const notes = await Note.find(where).sort(sortMap[sort] || sortMap.recent).limit(60).lean();
  return NextResponse.json({ ok: true, data: notes });
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireSession();

    const body = await req.json();
    const note = await Note.create({
      title: body.title,
      description: body.description || "",
      subject: body.subject || "",
      topic: body.topic || "",
      semester: body.semester || "",
      tags: body.tags || [],
      fileUrl: body.fileUrl || "",
      fileType: body.fileType || "",
      fileSize: body.fileSize || 0,
      author: { name: session.user?.name, email: session.user?.email },
      moderation: { state: "published" }, // si luego activas moderación, cámbialo a "pending"
    });

    return NextResponse.json({ ok: true, data: note }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Error" }, { status: 400 });
  }
}
