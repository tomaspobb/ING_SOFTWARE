"use client";
import React, { useState, useEffect } from "react";

// ⭐ Estrella fraccionada en cuartos
const StarFraction: React.FC<{ fraction: number }> = ({ fraction }) => {
  const fillPercentage = (fraction / 4) * 100;

  return (
    <div className="relative w-8 h-8">
      {/* Estrella vacía */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="absolute inset-0 w-8 h-8 text-gray-300"
      >
        <path d="M12 .587l3.668 7.568L24 9.753l-6 5.853 1.416 8.264L12 19.771l-7.416 4.099L6 15.606 0 9.753l8.332-1.598z" />
      </svg>

      {/* Parte llena */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="gold"
        className="absolute inset-0 w-8 h-8"
        style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
      >
        <path d="M12 .587l3.668 7.568L24 9.753l-6 5.853 1.416 8.264L12 19.771l-7.416 4.099L6 15.606 0 9.753l8.332-1.598z" />
      </svg>
    </div>
  );
};

interface Resumen {
  id: number;
  titulo: string;
  rating: number; // 0 a 20
}

const resúmenes: Resumen[] = [
  { id: 1, titulo: "Resumen #1", rating: 20 },
  { id: 2, titulo: "Resumen #2", rating: 16 },
  { id: 3, titulo: "Resumen #3", rating: 12 },
  { id: 4, titulo: "Resumen #4", rating: 8 },
  { id: 5, titulo: "Resumen #5", rating: 14 },
];

const Ranking: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [tempRating, setTempRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<"nombre" | "rating" | null>(null);

  // Filtrar según el rating aplicado
  const filteredResúmenes = selectedRating
    ? resúmenes.filter((r) => r.rating === selectedRating)
    : [...resúmenes];

  // Ordenar según sortBy
  if (sortBy === "nombre") {
    filteredResúmenes.sort((a, b) => a.titulo.localeCompare(b.titulo));
  } else if (sortBy === "rating") {
    filteredResúmenes.sort((a, b) => b.rating - a.rating);
  }

  // rating activo (hover > temp > 0)
  const activeRating = hoverRating ?? tempRating ?? 0;

  // cerrar menú de ordenar si clickeas afuera
  useEffect(() => {
    const handler = () => setShowSort(false);
    if (showSort) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showSort]);

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      {/* Cuadro del título */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800">Ranking</h2>
        <p className="text-sm text-gray-500">
          Mira los resúmenes mejor valorados por la comunidad
        </p>

        {/* Botones Filtros y Ordenar */}
        <div className="flex flex-col items-center gap-2 mt-3">
          <div className="flex justify-center gap-3 relative">
            {/* Filtros */}
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-1 border rounded-lg text-sm font-medium text-blue-600 border-blue-200 bg-white transition-all duration-300 hover:bg-blue-600 hover:text-white hover:scale-105"
            >
              Filtros
            </button>

            {/* Ordenar por */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSort(!showSort);
                }}
                className="px-4 py-1 border rounded-lg text-sm font-medium text-blue-600 border-blue-200 bg-white transition-all duration-300 hover:bg-blue-600 hover:text-white hover:scale-105"
              >
                Ordenar por
              </button>

              {showSort && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setSortBy("nombre");
                      setShowSort(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm rounded-t-lg transition-colors hover:bg-blue-100 hover:text-blue-700"
                  >
                    📑 Nombre
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("rating");
                      setShowSort(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm rounded-b-lg transition-colors hover:bg-blue-100 hover:text-blue-700"
                  >
                    ⭐ Mejor rankeado
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Texto del orden actual */}
          {sortBy && (
            <p className="text-sm text-gray-600">
              Ordenar por:{" "}
              {sortBy === "nombre" ? "📑 Nombre" : "⭐ Mejor rankeado"}
            </p>
          )}
        </div>
      </div>

      {/* Modal de filtros */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Filtros
            </h3>

            {/* Filtro estrellas */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex cursor-pointer">
                {Array.from({ length: 5 }).map((_, i) => {
                  const start = i * 4;
                  const fraction = Math.min(
                    4,
                    Math.max(0, activeRating - start)
                  );

                  return (
                    <div
                      key={i}
                      className="relative"
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      {Array.from({ length: 4 }).map((_, q) => (
                        <span
                          key={q}
                          className="absolute inset-0"
                          style={{
                            width: `${(q + 1) * 25}%`,
                            zIndex: 10 - q,
                          }}
                          onMouseEnter={() => setHoverRating(start + q + 1)}
                          onClick={() => setTempRating(start + q + 1)}
                        />
                      ))}
                      <StarFraction fraction={fraction} />
                    </div>
                  );
                })}
              </div>

              {/* Botón quitar (si hay selección) */}
              {(tempRating || selectedRating) && (
                <button
                  onClick={() => {
                    setTempRating(null);
                    setSelectedRating(null);
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all"
                >
                  <span className="text-lg font-bold">−</span>
                </button>
              )}
            </div>

            {/* Botón aplicar */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setSelectedRating(tempRating);
                  setShowModal(false);
                }}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-green-600 border-green-200 bg-white transition-all duration-300 hover:bg-green-600 hover:text-white hover:scale-105"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas del ranking */}
      <div className="grid gap-4">
        {filteredResúmenes.length > 0 ? (
          filteredResúmenes.map((resumen) => (
            <div
              key={resumen.id}
              className="flex items-center justify-between bg-white shadow-sm border border-gray-200 rounded-lg p-4"
            >
              {/* Número + Título + Estrellas */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                  {resumen.id}
                </div>

                <div>
                  <p className="text-gray-800 font-medium">{resumen.titulo}</p>
                  <div className="flex mt-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const start = i * 4;
                      const fraction = Math.min(
                        4,
                        Math.max(0, resumen.rating - start)
                      );
                      return <StarFraction key={i} fraction={fraction} />;
                    })}
                  </div>
                </div>
              </div>

              {/* Botón Ver */}
              <button className="px-4 py-1 border rounded-lg text-sm font-medium text-blue-600 border-blue-200 bg-white transition-all duration-300 hover:bg-blue-600 hover:text-white hover:scale-105">
                Ver
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">
            No se encontraron resúmenes con esa valoración.
          </p>
        )}
      </div>
    </div>
  );
};

export default Ranking;
