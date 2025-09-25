import React from "react";

const StarFraction: React.FC<{ filled: number }> = ({ filled }) => {
  const fillPercentage = (filled / 4) * 100;

  return (
    <div className="relative w-5 h-5 text-gray-300">
      {/* Fondo de estrella vacía */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
        className="absolute inset-0 w-5 h-5 text-gray-300"
      >
        <path d="M12 .587l3.668 7.568L24 9.753l-6 5.853 1.416 8.264L12 19.771l-7.416 4.099L6 15.606 0 9.753l8.332-1.598z" />
      </svg>

      {/* Parte llena según porcentaje */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="gold"
        viewBox="0 0 24 24"
        className="absolute inset-0 w-5 h-5"
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
  rating: number; // de 0 a 20 (20 = 5 estrellas llenas)
}

const resúmenes: Resumen[] = [
  { id: 1, titulo: "Resumen", rating: 20 }, 
  { id: 2, titulo: "Resumen", rating: 15 }, 
  { id: 3, titulo: "Resumen", rating: 10 }, 
  { id: 4, titulo: "Resumen", rating: 4 },  
];

const Ranking: React.FC = () => {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white px-6 py-4 border-b border-gray-200">
        <h2 className="text-center text-lg font-semibold text-gray-800">
          Ranking
        </h2>
      </div>

      {/* Lista */}
      <ul className="divide-y divide-gray-200">
        {resúmenes.map((resumen) => (
          <li
            key={resumen.id}
            className="flex items-center justify-between px-6 py-4"
          >
            {/* Número + Texto */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                {resumen.id}
              </div>

              {/* Texto */}
              <span className="text-gray-800 font-medium">{resumen.titulo}</span>

              {/* Estrellas */}
              <div className="flex ml-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const start = i * 4;
                  const end = start + 4;
                  const filled = Math.min(
                    4,
                    Math.max(0, resumen.rating - start)
                  );
                  return <StarFraction key={i} filled={filled} />;
                })}
              </div>
            </div>

            {/* Botón */}
            <button className="px-4 py-1 border rounded-lg text-sm font-medium text-blue-600 border-blue-200 bg-white transition-all duration-300 hover:bg-blue-600 hover:text-white hover:scale-105">
              Ver
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Ranking;
