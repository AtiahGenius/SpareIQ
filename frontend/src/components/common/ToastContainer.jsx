import React from 'react';
import { useApp } from '../../context/AppContext';

const TOAST_ICONS = { success: "✅", warning: "⚠️", error: "⛔", info: "ℹ️", default: "" };

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type ? 't-' + t.type : ''}`} role="status">
          {TOAST_ICONS[t.type] && <span className="t-icon">{TOAST_ICONS[t.type]}</span>}
          <span>{t.message || t.msg}</span>
          {t.undoFn && (
            <button
              onClick={() => {
                t.undoFn();
                removeToast(t.id);
              }}
              style={{
                background: 'none', border: 'none', color: 'inherit',
                fontWeight: 700, cursor: 'pointer', marginLeft: '10px',
                fontSize: '13px', textDecoration: 'underline'
              }}
            >
              Undo
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
