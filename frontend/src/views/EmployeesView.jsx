import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const EmployeesView = () => {
  const {
    employees, sales, createEmployee, resetPassword,
    toggleEmployeeStatus, currentUser, money, toast
  } = useApp();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('cashier');
  const [branch, setBranch] = useState('Main Shop');
  const [tempPass, setTempPass] = useState(Math.random().toString(36).slice(-8));

  // Leaderboard data
  const perf = {};
  sales.forEach(s => {
    if (!perf[s.empId]) perf[s.empId] = { name: s.empName || s.empId, count: 0, revenue: 0, profit: 0 };
    perf[s.empId].count++;
    perf[s.empId].revenue += (s.grandTotal || 0);
    perf[s.empId].profit += (s.items || []).reduce((a, i) => a + (i.profit || 0), 0);
  });
  const leaderRows = Object.values(perf).sort((a, b) => b.revenue - a.revenue);

  const handleCreate = () => {
    if (!name.trim()) {
      toast("Please enter a name", "error");
      return;
    }
    createEmployee({
      name: name.trim(),
      role,
      branch: branch.trim() || "Main Shop",
      password: tempPass.trim() || "changeme123"
    });
    setAddModalOpen(false);
    setName('');
    setTempPass(Math.random().toString(36).slice(-8));
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Employees</h1>
          <p>Manage sales user accounts and see performance</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAddModalOpen(true)}>
          + New Employee
        </button>
      </div>

      <div className="panel" style={{ marginBottom: '14px' }}>
        <h3>Employee Leaderboard<small>All-time sales performance</small></h3>
        {leaderRows.length > 0 ? (
          leaderRows.map((r, idx) => (
            <div className="leader-row" key={idx}>
              <div className={`leader-rank ${idx === 0 ? 'gold' : ''}`}>{idx + 1}</div>
              <div>
                <b>{r.name}</b>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.count} sales</div>
              </div>
              <div className="mono">{money(r.revenue)}</div>
              <div className="mono" style={{ color: 'var(--success)' }}>{money(r.profit)}</div>
            </div>
          ))
        ) : (
          <div className="empty" style={{ padding: '30px 10px' }}>No sales recorded yet.</div>
        )}
      </div>

      <div className="panel">
        <div className="tbl-wrap">
          <table className="data-tbl">
            <thead>
              <tr>
                <th>Employee ID</th><th>Name</th><th>Role</th><th>Branch</th>
                <th>Status</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id}>
                  <td className="mono">{e.id}</td>
                  <td>{e.name}</td>
                  <td><span className={`badge-role ${e.role}`}>{e.role}</span></td>
                  <td>{e.branch}</td>
                  <td><span className={`badge-status ${e.status}`}>{e.status}</span></td>
                  <td className="mono">{e.created}</td>
                  <td style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-sm" onClick={() => resetPassword(e.id)}>Reset PW</button>
                    <button
                      className={`btn btn-sm ${e.status === 'active' ? 'btn-danger' : ''}`}
                      onClick={() => toggleEmployeeStatus(e.id)}
                    >
                      {e.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {addModalOpen && (
        <div className="modal-bg active" role="dialog" aria-modal="true" onClick={(e) => { if (e.target.classList.contains('modal-bg')) setAddModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-head">
              <h3 style={{ fontFamily: 'var(--font-display)' }}>New Employee</h3>
              <button className="modal-close" onClick={() => setAddModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Yaw Owusu" />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="cashier">Sales User (Cashier)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="field">
                <label>Branch</label>
                <input value={branch} onChange={(e) => setBranch(e.target.value)} />
              </div>
              <div className="field">
                <label>Temporary Password</label>
                <input value={tempPass} onChange={(e) => setTempPass(e.target.value)} />
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '10px' }}>
                Employee ID will be generated automatically.
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCreate}>
                Create Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
