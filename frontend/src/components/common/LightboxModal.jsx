import React from 'react';
import { useApp } from '../../context/AppContext';

export const LightboxModal = () => {
  const { lightboxImg, setLightboxImg } = useApp();

  if (!lightboxImg) return null;

  return (
    <div
      className="modal-bg active"
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed image"
      style={{ zIndex: 90, cursor: 'zoom-out' }}
      onClick={() => setLightboxImg(null)}
    >
      <img
        src={lightboxImg}
        alt="Zoomed receipt photo"
        style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: '10px', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}
      />
    </div>
  );
};
