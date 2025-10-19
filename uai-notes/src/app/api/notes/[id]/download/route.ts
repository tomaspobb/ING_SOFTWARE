import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { TNote } from "../../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getModel() {
  const { default: M } = await import("mongoose");
  await M.connect(process.env.MONGODB_URI!, { dbName: "notivium" });
  // @ts-ignore
  return M.models.Note as mongoose.Model<TNote>;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const Note = await getModel();
  const doc = await Note.findById(new ObjectId(params.id));
  if (!doc?.pdfUrl) return NextResponse.json({ ok:false, error:"NOT_FOUND" }, { status:404 });

  await Note.updateOne({ _id: doc._id }, { $inc: { downloads: 1 } });
  return NextResponse.redirect(doc.pdfUrl, 302);
}
