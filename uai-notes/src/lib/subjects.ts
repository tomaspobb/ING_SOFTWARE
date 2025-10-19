// src/lib/subjects.ts
export const SUBJECTS = [
  "Minería de Datos",
  "Inteligencia Artificial",
  "Sistemas de Información",
  "Seguridad en TI",
  "Gestión de Proyectos Informáticos",
  "Lenguajes y Paradigmas de Programación",
  "Diseño de Software",
  "Programación Profesional",
  "Ingeniería de Software",
  "Estrategia TI",
  "Estructuras de Datos y Algoritmos",
  "Redes de Computadores",
  "Arquitectura de Sistemas",
  "Arquitectura Cloud",
  "Bases de Datos",
  "Sistemas Operativos",
] as const;

export type Subject = (typeof SUBJECTS)[number];
