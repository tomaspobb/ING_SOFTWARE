import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose, { Schema } from "mongoose";
import { SUBJECTS } from "@/lib/subjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.MONGODB_URI;

async function dbConnect() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
  const g = globalThis as any;
  if (!g._mongo) g._mongo = { conn: null, promise: null };
  if (g._mongo.conn) return g._mongo.conn;
  if (!g._mongo.promise) {
    g._mongo.promise = mongoose.connect(MONGODB_URI, {
      dbName: "notivium",
      bufferCommands: false,
    });
  }
  g._mongo.conn = await g._mongo.promise;
  return g._mongo.conn;
}

type TNote = {
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  keywords?: string[];
  authorName?: string;
  authorEmail?: string;
  pdfUrl?: string;
  year?: number;
  semester?: number;
  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  moderated: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const Note =
  (mongoose.models?.Note as mongoose.Model<TNote>) ??
  mongoose.model<TNote>(
    "Note",
    new Schema<TNote>(
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        subject: { type: String, required: true, enum: SUBJECTS },
        topic: { type: String, default: "" },
        keywords: { type: [String], default: [] },
        authorName: String,
        authorEmail: String,
        pdfUrl: String,
        year: Number,
        semester: Number,
        downloads: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        ratingAvg: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        moderated: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  );

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    await dbConnect();
    const email = (session.user.email as string).toLowerCase();
    const items = await Note.find({ authorEmail: email }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ ok: true, data: items });
  } catch (e: any) {
    if (e?.message?.includes("MONGODB_URI")) {
      return NextResponse.json({ ok: false, error: "DB_UNAVAILABLE", data: [] }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: e?.message || "ERROR" }, { status: 500 });
  }
}
