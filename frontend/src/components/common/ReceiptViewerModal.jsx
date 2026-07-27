import React from 'react';
import { useApp } from '../../context/AppContext';

export const ReceiptViewerModal = ({ receipt, onClose }) => {
  const { money, deleteReceipt, setLightboxImg, toast } = useApp();

  if (!receipt) return null;

  return (
    <div className="modal-bg active" role="dialog" aria-modal="true" onClick={(e) => { if (e.target.classList.contains('modal-bg')) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3 style={{ fontFamily: 'var(--font-display)' }}>
            {receipt.receiptNo} — {receipt.supplier}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="modal-body">
          <div className="review-grid">
            <div>
              <div className="paper">
                {receipt.imageDataUrl ? (
                  <img
                    className="paper-img"
                    alt={`Photo of receipt ${receipt.receiptNo}`}
                    style={{ cursor: 'zoom-in' }}
                    src={receipt.imageDataUrl}
                    onClick={() => setLightboxImg(receipt.imageDataUrl)}
                  />
                ) : (
                  <div className="paper-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                    No image attached
                  </div>
                )}
              </div>
              {receipt.imageDataUrl && (
                <div style={{ textAlign: 'center', fontSize: '10.5px', color: 'var(--muted)', marginTop: '4px' }}>Click photo to zoom</div>
              )}
              <div className="paper-jag" />

              <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm" onClick={() => window.print()}>🖨 Print</button>
                <button className="btn btn-sm" onClick={() => toast("Exported as PDF (demo)", "success")}>⬇ Export PDF</button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    deleteReceipt(receipt.id);
                    onClose();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            <div>
              <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div className="field">
                    <label>Supplier</label>
                    <div className="mono" style={{ fontWeight: 600 }}>{receipt.supplier}</div>
                  </div>
                </div>
                <div>
                  <div className="field">
                    <label>Invoice No.</label>
                    <div className="mono">{receipt.invoiceNo}</div>
                  </div>
                </div>
                <div>
                  <div className="field">
                    <label>Date</label>
                    <div className="mono">{receipt.date}</div>
                  </div>
                </div>
                <div>
                  <div className="field">
                    <label>Currency</label>
                    <div className="mono">{receipt.currency}</div>
                  </div>
                </div>
              </div>

              <table className="items-tbl">
                <thead>
                  <tr><th>Product</th><th>Code</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {receipt.items.map((i, idx) => (
                    <tr key={idx}>
                      <td>{i.name}</td>
                      <td className="mono">{i.code}</td>
                      <td>{i.qty}</td>
                      <td className="mono">{i.unitPrice.toFixed(2)}</td>
                      <td className="mono">{i.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '12px', textAlign: 'right', fontSize: '13px' }}>
                <div>Subtotal: <b className="mono">{money(receipt.subtotal)}</b></div>
                <div>Discount: <b className="mono">-{money(receipt.discount)}</b></div>
                <div>Tax: <b className="mono">{money(receipt.tax)}</b></div>
                <div style={{ fontSize: '16px', marginTop: '4px' }}>Grand Total: <b className="mono">{money(receipt.grandTotal)}</b></div>
              </div>

              {receipt.notes && (
                <div className="field" style={{ marginTop: '12px' }}>
                  <label>Notes</label>
                  <div>{receipt.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
