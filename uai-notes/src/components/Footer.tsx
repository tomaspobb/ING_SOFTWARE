"use client";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/auth")) return null; // ⟵ Oculta footer en el gate

  return (
    <footer className="nv-footer">
      <div className="container py-4">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold brand-gradient">Notivium</span>
            <small className="text-muted">© {new Date().getFullYear()}</small>
          </div>

          <div className="d-flex align-items-center gap-3">
            <a className="text-muted text-decoration-none" href="mailto:Notivium.adm@outlook.com">
              <i className="bi bi-envelope-fill me-1"></i>
              Soporte
            </a>
            <a className="text-muted text-decoration-none" href="#terminos">
              <i className="bi bi-shield-check me-1"></i>
              Términos
            </a>
            <a className="text-muted text-decoration-none" href="#privacidad">
              <i className="bi bi-lock-fill me-1"></i>
              Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
