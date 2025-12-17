import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./AnalysisModal.scss";

interface Props {
  open: boolean;
  onClose: () => void;
  summary: string;
  actions: string[];
  createdAtUtc: string;
}

export const AnalysisModal: React.FC<Props> = ({
  open,
  onClose,
  summary,
  actions,
  createdAtUtc,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setTimeout(() => cardRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal__card"
        ref={cardRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h3 className="modal__title">Meeting analysis</h3>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </header>

        <time className="modal__date">
          {new Date(createdAtUtc).toLocaleString()}
        </time>

        <div className="modal__content">
          <section className="modal__section">
            <h4>Summary</h4>
            <p>{summary}</p>
          </section>

          <section className="modal__section">
            <h4>Action items</h4>
            <ul>
              {actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};
