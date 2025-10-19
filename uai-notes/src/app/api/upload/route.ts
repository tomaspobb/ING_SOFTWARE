// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "NO_BLOB_TOKEN" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "FILE_REQUIRED" },
        { status: 400 }
      );
    }

    // nombre “seguro” (intenta tomar el nombre real si viene)
    const fallbackName = `apunte-${Date.now()}.pdf`;
    const asFile = file as File;
    const originalName = (asFile?.name || fallbackName).replace(/[^\w.\-]+/g, "_");

    // sube a Blob (público). addRandomSuffix evita colisiones
    const result = await put(originalName, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: asFile?.type || "application/octet-stream",
      token,
    });

    // result.url es la URL pública
    return NextResponse.json(
      {
        ok: true,
        url: result.url,
        pathname: result.pathname,
        size: asFile?.size ?? null,
        contentType: asFile?.type ?? null,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Blob upload error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "UPLOAD_ERROR" },
      { status: 500 }
    );
  }
}
