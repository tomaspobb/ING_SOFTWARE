// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEditorMode } from "./EditorModeProvider";
import { LogOut } from "lucide-react"; // reemplázalo por un <i> si no usas lucide

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { editorMode, setEditorMode } = useEditorMode();

  const isAuthed = status === "authenticated";
  const loading  = status === "loading";
  const isAdmin  = Boolean((session as any)?.isAdmin);

  // Oculta navbar en el home sin sesión (landing bonita)
  if (!isAuthed && pathname === "/") return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="nv-navbar-wrap sticky-top">
      <nav className="navbar nv-navbar" role="navigation" aria-label="Principal">
        <div className="container-nv d-flex align-items-center justify-content-between gap-3">

          {/* IZQUIERDA: brand + links */}
          <div className="d-flex align-items-center gap-3">
            <Link
              href={isAuthed ? "/apuntes" : "/"}
              className="navbar-brand nv-brand"
              aria-label="Notivium"
            >
              Notivium
            </Link>

            {isAuthed && (
              <ul className="navbar-nav d-flex flex-row gap-2">
                <li className="nav-item">
                  <Link
                    className={`nav-link nv-link ${isActive("/apuntes") ? "active" : ""}`}
                    href="/apuntes"
                    aria-current={isActive("/apuntes") ? "page" : undefined}
                  >
                    Apuntes
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className={`nav-link nv-link ${isActive("/ranking") ? "active" : ""}`}
                    href="/ranking"
                    aria-current={isActive("/ranking") ? "page" : undefined}
                  >
                    Ranking
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className={`nav-link nv-link ${isActive("/mis-apuntes") ? "active" : ""}`}
                    href="/mis-apuntes"
                    aria-current={isActive("/mis-apuntes") ? "page" : undefined}
                  >
                    Mis apuntes
                  </Link>
                </li>

                {/* Moderación: solo admin y con switch activado */}
                {isAdmin && editorMode && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link nv-link ${isActive("/moderacion") ? "active" : ""}`}
                      href="/moderacion"
                      aria-current={isActive("/moderacion") ? "page" : undefined}
                    >
                      Moderación
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* DERECHA: user + acciones */}
          <div className="d-flex align-items-center gap-2">
            {loading ? (
              <span className="text-secondary">Cargando…</span>
            ) : isAuthed ? (
              <>
                {/* Switch Editor visible solo si es admin */}
                {isAdmin && (
                  <div className="form-check form-switch me-2 text-white opacity-90">
                    <input
                      id="editorSwitch"
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={editorMode}
                      onChange={(e) => setEditorMode(e.target.checked)}
                    />
                    <label className="form-check-label small ms-1" htmlFor="editorSwitch">
                      Editor
                    </label>
                  </div>
                )}

                <span className="nv-username d-none d-sm-inline">
                  {session?.user?.name ?? session?.user?.email}
                </span>

                {/* Botón de salida: ícono circular */}
                <button
                  className="nv-logout-btn"
                  onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button
                className="btn btn-light btn-sm btn-pill"
                onClick={() => signIn("azure-ad", { callbackUrl: "/apuntes" })}
              >
                Ingresar con Microsoft
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
