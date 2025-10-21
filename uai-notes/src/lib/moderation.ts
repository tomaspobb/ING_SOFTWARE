// src/lib/moderation.ts
const BAD = [
  "weon","ql","qliao","culiao","culia","concha","maricon","ctm","ctmre","perra",
  "puta","puto","imbecil","imbécil","idiota","estupido","estúpido","hueon",
  "huev","hueón","tonto","lame","monga","mierda"
];

export function needsModeration(text: string) {
  const t = (text || "").toLowerCase();
  return BAD.some(b => t.includes(b));
}

export const ALWAYS_MODERATE_COMMENTS =
  (process.env.ALWAYS_MODERATE_COMMENTS ?? "false").toLowerCase() === "true";
