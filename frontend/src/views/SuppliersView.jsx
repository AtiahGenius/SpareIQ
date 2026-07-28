import React from 'react';
import { useApp } from '../context/AppContext';

export const SuppliersView = () => {
  const { receipts, suppliersMeta, money, showView } = useApp();

  const supplierNames = [...new Set(receipts.map(r => r.supplier))];

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Suppliers</h1>
          <p>Purchase history and spend by wholesaler</p>
        </div>
      </div>

      <div className="grid-3">
        {supplierNames.map(name => {
          const list = receipts.filter(r => r.supplier === name);
          const total = list.reduce((s, r) => s + r.grandTotal, 0);
          const meta = suppliersMeta[name] || { phone: "—", address: "—" };
          const productsCount = new Set(list.flatMap(r => (r.items || []).map(i => i.name))).size;

          return (
            <div className="panel" key={name}>
              <h3>{name}</h3>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '10px' }}>
                {meta.phone} &middot; {meta.address}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Total spent</span><b className="mono">{money(total)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Receipts</span><b>{list.length}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                <span>Products bought</span><b>{productsCount}</b>
              </div>

              <button className="btn btn-sm" onClick={() => showView('receipts')}>
                View Receipts
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
