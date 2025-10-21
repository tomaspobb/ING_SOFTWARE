// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect, Note, TNote } from "@/lib/models";
import { SUBJECTS } from "@/lib/subjects";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- helpers ---------- */
function buildSearchQuery(params: URLSearchParams) {
  const q: any = { rejected: { $ne: true } };

  const moderated = (params.get("moderated") ?? "true").toLowerCase() !== "false";
  if (moderated) q.moderated = true;

  const subject = params.get("subject");
  if (subject && SUBJECTS.includes(subject)) q.subject = subject;

  const topic = params.get("topic");
  if (topic) q.topic = { $regex: topic, $options: "i" };

  const k = params.get("q");
  if (k) {
    const regex = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    q.$or = [{ title: regex }, { description: regex }, { topic: regex }, { keywords: regex }];
  }

  const year = params.get("year");
  if (year) q.year = Number(year);

  const semester = params.get("semester");
  if (semester) q.semester = Number(semester);

  return q;
}

function buildSort(params: URLSearchParams) {
  switch ((params.get("sort") ?? "recent").toLowerCase()) {
    case "downloads":
      return { downloads: -1, createdAt: -1 };
    case "rating":
      return { ratingAvg: -1, ratingCount: -1 };
    case "views":
      return { views: -1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
}

/* ---------- GET ---------- */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
  } catch {
    return NextResponse.json({ ok: false, error: "DB_UNAVAILABLE", data: [] }, { status: 503 });
  }

  const sp = new URL(req.url).searchParams;
  const q = buildSearchQuery(sp);
  const sort = buildSort(sp);
  const limit = Math.min(parseInt(sp.get("limit") || "60", 10), 100);

  try {
    const items = await Note.find(q).sort(sort).limit(limit).lean();
    return NextResponse.json({ ok: true, data: items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "QUERY_ERROR", data: [] }, { status: 500 });
  }
}

/* ---------- POST ---------- */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
  } catch {
    return NextResponse.json({ ok: false, error: "DB_UNAVAILABLE" }, { status: 503 });
  }

  try {
    const session = await getServerSession(authOptions as any);
    const body = await req.json();

    const title = String(body?.title || "").trim();
    const subject = String(body?.subject || "");
    const pdfUrl = String(body?.pdfUrl || "");
    const year = Number(body?.year);
    const semester = Number(body?.semester);

    if (!title || !subject || !pdfUrl || !year || ![1, 2].includes(semester)) {
      return NextResponse.json({ ok: false, error: "MISSING_REQUIRED" }, { status: 400 });
    }
    if (!SUBJECTS.includes(subject)) {
      return NextResponse.json({ ok: false, error: "SUBJECT_NOT_ALLOWED" }, { status: 400 });
    }

    const doc = await Note.create({
      title,
      description: String(body.description || ""),
      subject,
      topic: String(body.topic || ""),
      keywords: Array.isArray(body.keywords)
        ? body.keywords.map((s: any) => String(s))
        : String(body.keywords || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      year,
      semester,
      authorName: session?.user?.name || String(body.authorName || ""),
      authorEmail: session?.user?.email || String(body.authorEmail || ""),
      pdfUrl,
      moderated: false,
      rejected: false,
    } as TNote);

    return NextResponse.json({ ok: true, data: doc }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "CREATE_ERROR" }, { status: 500 });
  }
}
