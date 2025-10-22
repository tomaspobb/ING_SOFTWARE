// src/lib/moderation.ts
export const BAD_WORDS = [
  "weon", "weon@", "maricon", "maricón", "qlo", "culiao", "culiado",
  "mierda", "puta", "conchetumadre", "ctm", "hdp", "hueon", "hueón",
  "imbecil", "imbécil", "idiota"
];

export function hasBadWords(text: string): boolean {
  const t = (text || "").toLowerCase();
  return BAD_WORDS.some(w => t.includes(w));
}
