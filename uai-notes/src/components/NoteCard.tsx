'use client';

import { motion } from 'framer-motion';
import { Eye, Download, Star, Cpu, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Props = {
  id?: string;           // 👈 ahora opcional
  _id?: string;          // 👈 acepta _id cuando hacemos {...n}
  title: string;
  subject: string;
  description?: string;
  topic?: string;
  keywords?: string[];
  authorName?: string;
  year?: number;
  semester?: number;
  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;
};

export default function NoteCard(props: Props) {
  const {
    id,
    _id,
    title,
    subject,
    description,
    authorName,
    topic,
    year,
    semester,
    downloads,
    views,
    ratingAvg,
    keywords,
  } = props;

  const router = useRouter();
  const noteId = id ?? _id; // 👈 clave del fix

  const goDetail = () => {
    if (!noteId) return; // hardening
    router.push(`/apuntes/${noteId}`);
  };

  const handleAISummary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/ai/summarize?q=${encodeURIComponent(title)}`);
    const data = await res.json();
    alert(data.summary);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 0 26px rgba(99,102,241,0.25)' }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="text-white"
      style={{ borderRadius: 22, cursor: noteId ? 'pointer' : 'default' }}
      onClick={goDetail}
    >
      <div
        className="p-4"
        style={{
          borderRadius: 22,
          background: 'linear-gradient(145deg, rgba(18,18,28,0.96), rgba(28,28,40,0.9))',
          border: '1px solid rgba(99,102,241,0.25)',
          backdropFilter: 'blur(6px)',
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="badge" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '0.75rem' }}>
            {subject}
          </span>
          <div className="d-flex align-items-center gap-2 text-secondary small">
            <div className="d-flex align-items-center gap-1"><Eye size={14} /> {views}</div>
            <div className="d-flex align-items-center gap-1"><Download size={14} /> {downloads}</div>
            <div className="d-flex align-items-center gap-1 text-warning"><Star size={14} fill="#facc15" /> {ratingAvg.toFixed(1)}</div>
          </div>
        </div>

        {/* Título – mantiene link pero evita duplicar click */}
        <Link
          href={noteId ? `/apuntes/${noteId}` : '#'}
          className="text-decoration-none"
          onClick={(e) => { if (!noteId) e.preventDefault(); e.stopPropagation(); }}
        >
          <h5 className="fw-semibold mb-2" style={{ color: '#e0e7ff', fontSize: '1.05rem', textShadow: '0 0 6px rgba(99,102,241,0.35)' }}>
            {title}
          </h5>
        </Link>

        <p className="small mb-3" style={{ color: '#a5b4fc', minHeight: 44 }}>
          {description || topic || 'Sin descripción disponible.'}
        </p>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center gap-2 text-light small"><User size={14} /> {authorName || 'Anónimo'}</div>
          <small className="text-white/70">{year ? `${year}/${semester ?? ''}` : '—'}</small>
        </div>

        {keywords?.length ? (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {keywords.slice(0, 3).map((k) => (
              <span key={k} className="badge rounded-pill"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c7d2fe', fontSize: '0.7rem' }}>
                #{k}
              </span>
            ))}
          </div>
        ) : null}

        <div className="rounded-3 p-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
             onClick={(e) => e.stopPropagation()}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 mb-1">
              <Cpu size={14} color="#8b5cf6" />
              <span className="fw-semibold" style={{ color: '#a78bfa', fontSize: '0.8rem' }}>Resumen IA</span>
            </div>
            <button onClick={handleAISummary} className="btn btn-sm btn-outline-light" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
              Generar
            </button>
          </div>
          <p className="small mb-0" style={{ color: '#c7d2fe', fontSize: '0.75rem' }}>
            Obtén un resumen automático de este apunte.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
