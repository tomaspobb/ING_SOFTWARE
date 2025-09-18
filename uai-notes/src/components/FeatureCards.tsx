export default function FeatureCards() {
  return (
    <section id="features" className="py-5">
      <div className="container">
        <div className="row g-4">
          {[
            { t: "Búsqueda y filtros", d: "Encuentra apuntes por asignatura, tema, carrera y palabras clave." },
            { t: "Metadatos útiles", d: "Ficha con autor, fecha, tags, descargas y puntaje de utilidad." },
            { t: "Califica y comenta", d: "Valora la calidad y deja feedback para priorizar lo mejor." },
          ].map((c, i) => (
            <div className="col-md-4" key={i}>
              <div className="card h-100 bg-body-tertiary text-light border-0">
                <div className="card-body">
                  <h5 className="card-title">{c.t}</h5>
                  <p className="card-text">{c.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
