'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, UploadCloud } from 'lucide-react';
import Link from 'next/link';

type Props = {
  defaultCollapsed?: boolean;
};

export default function UploadBanner({ defaultCollapsed = true }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // recordar preferencia
  useEffect(() => {
    const saved = localStorage.getItem('nvUploadCollapsed');
    if (saved === 'false') setCollapsed(false);
  }, []);
  useEffect(() => {
    localStorage.setItem('nvUploadCollapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div
      className="section-card nv-upload-banner"
      style={{ borderRadius: 22, overflow: 'hidden' }}
    >
      {/* Header compacto */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-100 d-flex align-items-center justify-content-between"
        style={{
          background: 'transparent',
          border: 0,
          padding: '14px 18px',
          cursor: 'pointer',
        }}
        aria-expanded={!collapsed}
        aria-controls="nv-upload-body"
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-inline-flex align-items-center justify-content-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'linear-gradient(180deg,#f3f6ff,#eef3ff)',
              border: '1px solid #e7ecf7',
            }}
          >
            <UploadCloud size={18} color="#3b82f6" />
          </div>
          <div className="text-start">
            <div style={{ fontWeight: 700, lineHeight: 1 }}>Sube tu apunte</div>
            <div className="small text-secondary">
              Comparte tu PDF con título, asignatura, semestre y etiquetas.
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Botón rápido cuando está colapsado */}
          {collapsed && (
            <Link href="/apuntes/upload" onClick={(e)=>e.stopPropagation()} className="btn btn-primary btn-sm">
              Subir apunte
            </Link>
          )}
          <ChevronDown
            size={18}
            style={{
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform .2s',
              opacity: .75
            }}
          />
        </div>
      </button>

      {/* Cuerpo desplegable */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            id="nv-upload-body"
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', borderTop: '1px solid #e9edf5' }}
          >
            <div className="p-3 p-md-4">
              <ul className="mb-3" style={{ color: '#475569' }}>
                <li>Formato: PDF (o imagen JPG/PNG opcional)</li>
                <li>
                  Asigna <b>asignatura, tema, año/semestre y palabras clave</b>
                </li>
                <li>El archivo se aloja en Blob y la ficha en MongoDB</li>
              </ul>

              <Link href="/apuntes/upload" className="btn btn-primary w-100">
                Comenzar
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
