import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || 'documento';

  // Aquí puedes conectar un modelo real (OpenAI/HuggingFace) cuando quieras.
  // Por ahora devolvemos un resumen simulado para probar el flujo end-to-end.
  const summary =
    `🧠 Resumen automático de "${q}":
• Puntos clave identificados y sintetizados.
• Ideas principales conectadas y priorizadas.
• Próximamente, este resumen se generará leyendo el PDF real.`;

  return NextResponse.json({ summary });
}
