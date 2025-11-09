// src/lib/moderation.ts
// Detección simple y rápida: normaliza acentos y compara contra una lista.
// (Puedes mejorarla cuando quieras con una lib como "bad-words-es" o un modelo.)

const BAD_WORDS = [
  "weon","weona","weones","weonas","hueon","hueona",
  "ql","qla","culiao","culiada","ctm","conchetumare","conchesumadre",
  "maricon","maricón","maricona","puta","puto","mierda","imbecil","imbécil",
  "estupido","estúpido","idiota","perkin","sapoperro"
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9áéíóúñü\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isProfane(input: string): boolean {
  if (!input) return false;
  const text = normalize(input);
  return BAD_WORDS.some(w => text.includes(normalize(w)));
}
