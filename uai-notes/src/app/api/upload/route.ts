// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitize(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ ok: false, error: "NO_BLOB_TOKEN" }, { status: 500 });
    }

    const ctype = req.headers.get("content-type") || "";
    let file: Blob | null = null;
    let filename = `apunte-${Date.now()}.bin`;

    if (ctype.startsWith("multipart/form-data")) {
      // Front envía FormData("file", file) + ("filename", opcional)
      const form = await req.formData();
      const f = form.get("file");
      if (!(f instanceof Blob)) {
        return NextResponse.json({ ok: false, error: "NO_FILE" }, { status: 400 });
      }
      file = f;
      const provided = (form.get("filename") as string) || (f as any)?.name || filename;
      filename = sanitize(provided);
    } else {
      // Alternativa: body crudo + header "x-filename"
      file = await req.blob();
      const provided = req.headers.get("x-filename");
      if (provided) filename = sanitize(provided);
    }

    // Validar extensión
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) {
      return NextResponse.json(
        { ok: false, error: "UNSUPPORTED_TYPE" },
        { status: 400 }
      );
    }

    // Subir a Vercel Blob (público)
    const { url } = await put(filename, file!, {
      access: "public",
      token,
      addRandomSuffix: true, // evita colisiones
    });

    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    console.error("UPLOAD_ERROR:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || "UPLOAD_ERROR" },
      { status: 500 }
    );
  }
}
