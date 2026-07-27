import React from 'react';
import { useApp } from '../../context/AppContext';

export const ConfirmModal = () => {
  const { confirmModal, closeConfirm } = useApp();

  if (!confirmModal.active) return null;

  return (
    <div className="modal-bg active" role="alertdialog" aria-modal="true" style={{ zIndex: 70 }} onClick={(e) => { if (e.target.classList.contains('modal-bg')) closeConfirm(); }}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '30px 26px' }}>
          <div style={{ fontSize: '30px', marginBottom: '8px' }}>⚠️</div>
          <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-display)' }}>{confirmModal.title}</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '22px' }}>{confirmModal.msg}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn" onClick={closeConfirm}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                const cb = confirmModal.onYes;
                closeConfirm();
                if (cb) cb();
              }}
            >
              Yes, delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
