"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEditorMode } from "./EditorModeProvider";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/auth")) return null; // ⟵ Oculta navbar en el gate

  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const loading = status === "loading";
  const isAdmin = Boolean((session as any)?.isAdmin);

  // Switch Editor (solo admin)
  let editorSwitch: React.ReactNode = null;
  try {
    if (isAuthed && isAdmin) {
      const { editorMode, setEditorMode } = useEditorMode();
      editorSwitch = (
        <div className="form-check form-switch me-2">
          <input
            id="editorSwitch"
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={editorMode}
            onChange={(e) => setEditorMode(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor="editorSwitch">
            Editor
          </label>
        </div>
      );
    }
  } catch {}

  return (
    <div className="nv-navbar-wrap sticky-top">
      <nav className="navbar navbar-expand-lg nv-navbar">
        <div className="container">
          {/* Marca → /apuntes si hay sesión; si no, al gate */}
          <a
            className="navbar-brand fw-bold brand-gradient"
            href={isAuthed ? "/apuntes" : "/auth"}
            aria-label="Notivium"
          >
            Notivium
          </a>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#nvNav"
            aria-controls="nvNav"
            aria-expanded="false"
            aria-label="Alternar navegación"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div id="nvNav" className="collapse navbar-collapse">
            {isAuthed && (
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item"><a className="nav-link" href="/apuntes">Apuntes</a></li>
                <li className="nav-item"><a className="nav-link" href="/ranking">Ranking</a></li>
              </ul>
            )}

            <div className="ms-auto d-flex align-items-center gap-2">
              {loading ? (
                <span className="text-secondary">Cargando…</span>
              ) : isAuthed ? (
                <>
                  {editorSwitch}
                  <span className="text-secondary small d-none d-md-inline nv-ellipsis-1">
                    {session?.user?.name ?? session?.user?.email}
                  </span>
                  <button
                    className="btn btn-outline-light btn-sm btn-pill"
                    onClick={() => signOut({ callbackUrl: "/auth" })}
                  >
                    Cerrar sesión
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
        </div>
      </nav>
    </div>
  );
}
