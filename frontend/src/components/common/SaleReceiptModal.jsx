import React from 'react';
import { useApp } from '../../context/AppContext';

function fakeBarcodeSVG(text) {
  let bars = "", x = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const w = 1 + (code % 3);
    if (code % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="32" fill="#1a1a1a"/>`;
    x += w + 1;
  }
  return `<svg viewBox="0 0 ${Math.max(x, 10)} 32" width="100%" height="36" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">${bars}</svg>`;
}

export const SaleReceiptModal = ({ sale, onClose }) => {
  const { money, shopProfile } = useApp();

  if (!sale) return null;

  const barcodeSvg = fakeBarcodeSVG(sale.receiptNo + sale.txnId);

  return (
    <div className="modal-bg active" role="dialog" aria-modal="true" onClick={(e) => { if (e.target.classList.contains('modal-bg')) onClose(); }}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-head">
          <h3 style={{ fontFamily: 'var(--font-display)' }}>Sales Receipt — {sale.receiptNo}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="modal-body">
          <div className="paper" style={{ padding: '20px', textAlign: 'center' }}>
            {shopProfile.logo && (
              <img src={shopProfile.logo} alt="Shop logo" style={{ height: '44px', marginBottom: '6px' }} />
            )}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>{shopProfile.name}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '10px' }}>
              {shopProfile.address} &middot; Tel: {shopProfile.phone}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', textAlign: 'left' }}>
              Receipt: {sale.receiptNo} &middot; {sale.txnId}<br />
              Date: {sale.date} {sale.time}<br />
              Cashier: {sale.empName}
            </div>

            <table className="items-tbl" style={{ marginTop: '10px', textAlign: 'left' }}>
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
              </thead>
              <tbody>
                {(sale.items || []).map((i, idx) => {
                  const price = Number(i.sellingPrice ?? i.unitPrice ?? 0);
                  const itemTotal = Number(i.total ?? (price * (i.qty || 1)));
                  return (
                    <tr key={idx}>
                      <td>{i.name || 'Item'}</td>
                      <td>{i.qty || 1}</td>
                      <td className="mono">{price.toFixed(2)}</td>
                      <td className="mono">{itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontSize: '12.5px', marginTop: '10px' }}>
              <div>Subtotal: <b className="mono">{money(sale.subtotal)}</b></div>
              <div>Discount: <b className="mono">-{money(sale.discount)}</b></div>
              <div>Tax: <b className="mono">{money(sale.tax)}</b></div>
              <div style={{ fontSize: '15px' }}>Total: <b className="mono">{money(sale.grandTotal)}</b></div>
              <div>Paid ({sale.paymentMethod}): <b className="mono">{money(sale.amountPaid)}</b></div>
              <div>Balance: <b className="mono">{money(sale.balance)}</b></div>
            </div>

            <div style={{ marginTop: '14px', fontSize: '12px' }}>Thank you for your business! 🏍️</div>

            <div style={{ background: '#fff', padding: '8px 6px 6px', borderRadius: '6px', marginTop: '12px' }}>
              <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#1a1a1a', marginTop: '2px' }}>{sale.receiptNo}</div>
            </div>
          </div>
          <div className="paper-jag" />

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" onClick={() => {
              if (window.electronAPI && window.electronAPI.printReceipt) {
                window.electronAPI.printReceipt();
              } else {
                window.print();
              }
            }}>🖨 Print Receipt</button>
          </div>
        </div>
      </div>
    </div>
  );
};
