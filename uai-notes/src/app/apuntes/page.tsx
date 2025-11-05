'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUBJECTS } from '@/lib/subjects';
import NoteCard from '@/components/NoteCard';
import UploadBanner from '@/components/UploadBanner'; // ⬅️ nuevo banner
import { FolderOpen, LayoutGrid, List } from 'lucide-react';

type Note = {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  keywords?: string[];
  authorName?: string;
  authorEmail?: string;
  pdfUrl?: string;
  year?: number;
  semester?: number;
  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt?: string;
};

export default function ApuntesRepositoryPage() {
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // filtros
  const [subject, setSubject] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recent');
  const [year, setYear] = useState<string>('');
  const [semester, setSemester] = useState<string>('');

  // vistas
  const [viewMode, setViewMode] = useState<'grid' | 'folders' | 'list'>('grid');
  // carpetas OCULTAS por defecto
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>(
    Object.fromEntries(SUBJECTS.map((s) => [s, true]))
  );

  // años sugeridos
  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const start = 2018;
    const arr: number[] = [];
    for (let y = now + 1; y >= start; y--) arr.push(y);
    return arr;
  }, []);

  // fetch
  useEffect(() => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (topic) params.set('topic', topic);
    if (q) params.set('q', q);
    if (year) params.set('year', year);
    if (semester) params.set('semester', semester);
    params.set('sort', sort);

    setLoading(true);
    setErr(null);

    fetch(`/api/notes?${params.toString()}`)
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (!r.ok) throw new Error(json?.error || 'FETCH_ERROR');
        return json;
      })
      .then((d) => setItems(d?.data ?? []))
      .catch((e) => setErr(e.message || 'FETCH_ERROR'))
      .finally(() => setLoading(false));
  }, [subject, topic, q, year, semester, sort]);

  const groupedBySubject = useMemo(() => {
    return items.reduce<Record<string, Note[]>>((acc, n) => {
      const key = n.subject || 'Sin asignatura';
      if (!acc[key]) acc[key] = [];
      acc[key].push(n);
      return acc;
    }, {});
  }, [items]);

  const toggleCollapse = (subj: string) => {
    setCollapsedSubjects((s) => ({ ...s, [subj]: !s[subj] }));
  };

  return (
    <motion.div
      className="container-nv my-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="nv-title fs-2 mb-0">Apuntes</h1>
          <p className="nv-subtitle mb-0">Busca, filtra y explora los apuntes de Ing. Civil Informática.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={14} className="me-1" />
              Grid
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'folders' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('folders')}
            >
              <FolderOpen size={14} className="me-1" />
              Carpetas
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} className="me-1" />
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <motion.div
        className="section-card section-card--dark p-4 mb-3"
        style={{ borderRadius: '22px' }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Asignatura</label>
            <select className="form-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">— Todas —</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Tema</label>
            <input
              className="form-control"
              placeholder="Grafos, Sistemas…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Palabras clave</label>
            <input
              className="form-control"
              placeholder="resumen, guía…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Año</label>
            <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">—</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label">Semestre</label>
            <select className="form-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">—</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Ordenar</label>
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recent">Recientes</option>
              <option value="downloads">Descargas</option>
              <option value="rating">Mejor valorados</option>
              <option value="views">Más vistos</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Banner de subida (colapsable, ocupa poco espacio por defecto) */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <UploadBanner defaultCollapsed={true} />
      </motion.div>

      {/* Resultados */}
      {loading ? (
        <div className="nv-card nv-card--dark p-4 text-center mt-3" style={{ borderRadius: '22px' }}>
          Cargando…
        </div>
      ) : err ? (
        <div className="nv-card nv-card--dark p-4 mt-3" style={{ borderRadius: '22px' }}>
          <div className="fw-semibold mb-1">No pudimos cargar los apuntes.</div>
          <div className="text-secondary small">
            {err === 'DB_UNAVAILABLE'
              ? 'Problema de conexión con la base de datos. Intenta de nuevo más tarde.'
              : 'Intenta refrescar o probar más tarde.'}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="p-4 rounded-4 shadow-sm fade-in mt-3 nv-surface-dim" style={{ borderRadius: '22px' }}>
          <div className="fw-semibold fs-6 mb-2">No hay resultados con los filtros actuales.</div>
          <p className="text-secondary small mb-0">
            Prueba cambiando la asignatura o las palabras clave. También puedes compartir tu propio material para que otros lo encuentren.
          </p>
        </div>
      ) : (
        <div className="row g-4 mt-2">
          <div className="col-12">
            {/* Carpetas */}
            <AnimatePresence mode="popLayout">
              {viewMode === 'folders' &&
                Object.keys(groupedBySubject)
                  .sort()
                  .map((subj) => {
                    const group = groupedBySubject[subj];
                    const collapsed = !!collapsedSubjects[subj];
                    return (
                      <motion.div key={subj} layout className="mb-3">
                        <div
                          className="d-flex align-items-center justify-content-between p-3 rounded-3 nv-surface-dim"
                          style={{ cursor: 'pointer', borderRadius: '18px' }}
                          onClick={() => toggleCollapse(subj)}
                        >
                          <div>
                            <div style={{ fontWeight: 700 }}>{subj}</div>
                            <div className="text-secondary small">{group.length} apuntes</div>
                          </div>
                          <div className="text-end small text-secondary">{collapsed ? 'Mostrar' : 'Ocultar'}</div>
                        </div>

                        <AnimatePresence>
                          {!collapsed && (
                            <motion.div
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="row g-3 mt-2"
                            >
                              {group.map((n) => (
                                <motion.div key={n._id} layout className="col-md-6 col-xl-4">
                                  <NoteCard {...n} />
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
            </AnimatePresence>

            {/* Grid */}
            {viewMode === 'grid' && (
              <motion.div layout className="row g-3">
                {items.map((n) => (
                  <motion.div key={n._id} layout className="col-md-6 col-xl-4">
                    <NoteCard {...n} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Lista */}
            {viewMode === 'list' && (
              <div className="list-group mt-1">
                {items.map((n) => (
                  <a
                    key={n._id}
                    href={`/apuntes/${n._id}`}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-start nv-surface-dim"
                    style={{ borderRadius: 12 }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{n.title}</div>
                      <div className="text-secondary small">
                        {n.subject} • {n.authorName || 'Anónimo'} • {n.year || '—'}
                      </div>
                    </div>
                    <span className="btn btn-sm btn-outline-light">Ver</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
