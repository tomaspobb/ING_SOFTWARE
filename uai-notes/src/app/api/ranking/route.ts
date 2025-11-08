import { NextRequest, NextResponse } from "next/server";
import {dbConnect, Note} from "@/lib/models";

// —— Helpers
function parseMetric(v: string | null): "rating" | "downloads" {
  return v === "downloads" ? "downloads" : "rating";
}
function parseDays(v: string | null): 7 | 30 | 90 {
  const n = Number(v);
  return (n === 7 || n === 30 || n === 90) ? n : 30;
}

// IMDB weighted rating: https://en.wikipedia.org/wiki/Bayesian_average
// score = (v/(v+m))*R + (m/(v+m))*C
function weightedRating(params: { R: number; v: number; C: number; m: number }) {
  const { R, v, C, m } = params;
  if (v <= 0) return 0;
  return (v / (v + m)) * R + (m / (v + m)) * C;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const sp = req.nextUrl.searchParams;
    const metric = parseMetric(sp.get("by"));
    const days = parseDays(sp.get("days"));
    const subject = sp.get("subject")?.trim() || "";
    const limit = Math.min(Number(sp.get("limit") || 30), 100);

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);

    // Ventana anterior (para prevRank)
    const prevStart = new Date(now);
    prevStart.setDate(prevStart.getDate() - days * 2);
    const prevEnd = new Date(now);
    prevEnd.setDate(prevEnd.getDate() - days);

    // Filtro base
    const baseFilter: any = {};
    // Tip: si quieres considerar "actividad reciente", puedes usar updatedAt
    baseFilter.createdAt = { $lte: now }; // actual
    // si prefieres limitar por periodo (lo dejo así para rating; si tienes descargas por día, ver nota más abajo)
    // baseFilter.createdAt = { $gte: start, $lte: now };

    if (subject) baseFilter.subject = subject;

    // === 1) CARGA NOTAS PERIODO ACTUAL ===
    const notes = await Note.find(baseFilter)
      .select({
        title: 1,
        description: 1,
        subject: 1,
        semester: 1,
        downloads: 1,
        ratingAvg: 1,
        ratingCount: 1,
        authorName: 1,
        createdAt: 1,
      })
      .lean();

    // Promedio global de rating para IMDB (C)
    const ratingsWithVotes = notes.filter((n: any) => (n.ratingCount ?? 0) > 0);
    const C =
      ratingsWithVotes.length > 0
        ? ratingsWithVotes.reduce((acc: number, n: any) => acc + (n.ratingAvg || 0), 0) /
          ratingsWithVotes.length
        : 3.5; // fallback sano

    const m = 5; // votos mínimos “virtuales” (ajústalo a tu realidad)

    // Puntaje según métrica
    const withScore = notes.map((n: any) => {
      const ratingScore = weightedRating({
        R: n.ratingAvg || 0,
        v: n.ratingCount || 0,
        C,
        m,
      });

      const downloadsScore = n.downloads || 0; // TODO: si luego guardas descargas por día, suma sólo en [start..now]

      return {
        _id: String(n._id),
        title: n.title,
        description: n.description || "",
        subject: n.subject || "",
        semester: n.semester ?? "",
        downloads: n.downloads || 0,
        ratingAvg: n.ratingAvg || 0,
        ratingCount: n.ratingCount || 0,
        authorName: n.authorName || "",
        score: metric === "rating" ? ratingScore : downloadsScore,
      };
    });

    // Orden actual
    withScore.sort((a, b) => b.score - a.score);
    const ranked = withScore.slice(0, limit).map((n, idx) => ({ ...n, rank: idx + 1 }));

    // === 2) PREV RANK (ventana anterior, opcional) ===
    const prevFilter: any = { ...baseFilter, createdAt: { $gte: prevStart, $lte: prevEnd } };

    const prevNotes = await Note.find(prevFilter)
      .select({ downloads: 1, ratingAvg: 1, ratingCount: 1 })
      .lean();

    const prevRatingsWithVotes = prevNotes.filter((n: any) => (n.ratingCount ?? 0) > 0);
    const prevC =
      prevRatingsWithVotes.length > 0
        ? prevRatingsWithVotes.reduce((acc: number, n: any) => acc + (n.ratingAvg || 0), 0) /
          prevRatingsWithVotes.length
        : C;

    const prevScored = prevNotes.map((n: any) => {
      const ratingScore = weightedRating({
        R: n.ratingAvg || 0,
        v: n.ratingCount || 0,
        C: prevC,
        m,
      });
      const downloadsScore = n.downloads || 0;
      const score = metric === "rating" ? ratingScore : downloadsScore;
      return { _id: String(n._id), score };
    });
    prevScored.sort((a, b) => b.score - a.score);
    const prevRankMap = new Map(prevScored.map((n, idx) => [n._id, idx + 1]));

    const items = ranked.map((n) => ({
      ...n,
      prevRank: prevRankMap.get(n._id) ?? null,
      trend: undefined as number[] | undefined, // opcional: ver nota abajo
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error("RANKING_API_ERROR", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
