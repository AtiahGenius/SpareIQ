import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AuditLogView = () => {
  const { auditLog } = useApp();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(1); }
  };

  const getSortArrow = (key) => {
    if (sortKey !== key) return '';
    return sortDir === 1 ? ' ▲' : ' ▼';
  };

  let list = [...auditLog];
  if (sortKey) {
    list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = String(av).localeCompare(String(bv));
      return cmp * sortDir;
    });
  }

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Audit Log</h1>
          <p>Every important action, tracked with time and user</p>
        </div>
      </div>

      <div className="panel">
        <div className="tbl-wrap">
          <table className="data-tbl">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('time')}>Time{getSortArrow('time')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('user')}>User{getSortArrow('user')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('action')}>Action{getSortArrow('action')}</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((a, idx) => (
                <tr key={idx}>
                  <td className="mono">{new Date(a.time).toLocaleString()}</td>
                  <td>{a.user}</td>
                  <td><b>{a.action}</b></td>
                  <td>{a.detail || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
              ← Prev
            </button>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              Page {currentPage} of {totalPages} &middot; {list.length} total
            </span>
            <button className="btn btn-sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
