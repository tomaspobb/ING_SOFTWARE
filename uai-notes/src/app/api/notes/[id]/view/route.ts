import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { TNote } from "../../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getModel() {
  const { default: M } = await import("mongoose");
  await M.connect(process.env.MONGODB_URI!, { dbName: "notivium" });
  const { default: mod } = await import("../../route"); // reusa el modelo
  // @ts-ignore
  return M.models.Note as mongoose.Model<TNote>;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const Note = await getModel();
  const id = params.id;
  const doc = await Note.findById(new ObjectId(id));
  if (!doc?.pdfUrl) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  // incrementa vistas y redirige al blob
  await Note.updateOne({ _id: doc._id }, { $inc: { views: 1 } });
  return NextResponse.redirect(doc.pdfUrl, 302);
}
