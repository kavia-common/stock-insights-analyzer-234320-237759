import React, { useEffect, useRef } from 'react';

// PUBLIC_INTERFACE
export default function Modal({ title, children, onClose, actions, labelledById }) {
  /** Accessible modal dialog with focus trap (minimal) and Escape to close. */
  const dialogRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    lastFocused.current = document.activeElement;
    const el = dialogRef.current;
    if (el) el.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        // minimal focus trap
        const focusable = dialogRef.current?.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (lastFocused.current && lastFocused.current.focus) lastFocused.current.focus();
    };
  }, [onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,24,39,0.55)',
        zIndex: 2500,
        display: 'grid',
        placeItems: 'center',
        padding: 14
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        tabIndex={-1}
        className="card"
        style={{ width: 'min(560px, 94vw)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <h2 id={labelledById} style={{ margin: 0 }}>
            {title}
          </h2>
          <button type="button" className="btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div style={{ marginTop: 10 }}>{children}</div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {actions}
        </div>
      </div>
    </div>
  );
}
