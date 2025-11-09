"use client";

import { useEffect } from "react";

export type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  options,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  options?: ConfirmOptions;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const {
    title = "¿Confirmar acción?",
    message = "Esta acción no se puede deshacer.",
    confirmText = "Eliminar",
    cancelText = "Cancelar",
    danger = true,
  } = options || {};

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: "rgba(2,6,23,.45)", zIndex: 1055 }}
      onClick={onClose}
      aria-modal
      role="dialog"
    >
      <div
        className="container-nv h-100 d-flex align-items-center justify-content-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nv-card p-4" style={{ borderRadius: 18, maxWidth: 420, width: "100%" }}>
          <h5 className="mb-2">{title}</h5>
          <p className="text-muted mb-3">{message}</p>
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              {cancelText}
            </button>
            <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
