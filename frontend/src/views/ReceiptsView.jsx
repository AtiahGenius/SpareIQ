import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const ReceiptsView = ({ onOpenReceiptModal }) => {
  const { receipts, money, showView } = useApp();
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const suppliers = [...new Set(receipts.map(r => r.supplier))];
  const filtered = (supplierFilter ? receipts.filter(r => r.supplier === supplierFilter) : receipts)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Receipts</h1>
          <p>{receipts.length} receipts stored</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="btn btn-sm"
            value={supplierFilter}
            onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
          >
            <option value="">All suppliers</option>
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button className="btn btn-primary btn-sm" onClick={() => showView('upload')}>
            + New
          </button>
        </div>
      </div>

      <div className="receipt-grid">
        {pageItems.length > 0 ? (
          pageItems.map(r => (
            <div className="receipt-card" key={r.id} onClick={() => onOpenReceiptModal(r)}>
              {r.status === 'duplicate' ? (
                <div className="stamp dup">Possible Dup</div>
              ) : (
                <div className="stamp">Verified</div>
              )}
              <div
                className="thumb"
                style={r.imageDataUrl ? { backgroundImage: `url(${r.imageDataUrl})` } : undefined}
              >
                {!r.imageDataUrl && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l3 3v17l-2-1-2 1-2-1-2 1-2-1-2 1V2Z" /></svg>
                )}
              </div>
              <div className="info">
                <div className="supplier">{r.supplier}</div>
                <div className="meta">{r.date} &middot; {r.receiptNo}</div>
                <div className="amount">{money(r.grandTotal)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>No receipts match your selection.</div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <button className="btn btn-sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
            Page {currentPage} of {totalPages} &middot; {filtered.length} total
          </span>
          <button className="btn btn-sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
