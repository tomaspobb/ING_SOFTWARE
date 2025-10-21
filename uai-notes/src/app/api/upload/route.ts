import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Espera un FormData con:
 *  - file: File (obligatorio)
 *  - filename: string (opcional)
 *
 * Devuelve: { ok: true, url, pathname }
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: "FILE_REQUIRED" }, { status: 400 });
    }

    const safeName =
      (form.get("filename") as string | null) ||
      file.name?.replace(/[^\w\-.]+/g, "_") ||
      `archivo_${Date.now()}.pdf`;

    const blob = await put(safeName, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN, // <- asegúrate de tenerlo en .env.local
    });

    return NextResponse.json({ ok: true, url: blob.url, pathname: blob.pathname });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "UPLOAD_ERROR" },
      { status: 500 }
    );
  }
}
