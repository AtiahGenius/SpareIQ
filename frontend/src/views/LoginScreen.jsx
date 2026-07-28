import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LoginScreen = () => {
  const { attemptLogin } = useApp();
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!empId || !password) {
      setErrorMsg('Please enter both Employee ID and password.');
      return;
    }
    const res = await attemptLogin(empId, password);
    if (!res || !res.success) {
      setErrorMsg((res && (res.msg || res.error)) || 'Login failed. Please check credentials.');
    } else {
      setErrorMsg('');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">M</div>
          <div className="brand-text">SpareIQ <span>Parts Intelligence</span></div>
        </div>
        <div className="login-title">Sign in</div>
        <div className="login-sub">Enter your Employee ID and password to continue.</div>

        {errorMsg && <div className="login-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Employee ID</label>
            <input
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              placeholder="e.g. EMP0001"
              autoComplete="off"
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit">
            Sign In
          </button>
        </form>

        <div className="login-hint">
          Demo accounts — <b>EMP0001</b> / admin123 (Administrator), <b>EMP0002</b> / cashier123 (Sales User), <b>EMP0003</b> / cashier123 (Sales User, disabled).
        </div>

        <div style={{ textAlign: 'center', fontSize: '10.5px', color: 'var(--muted)', marginTop: '16px' }}>
          SpareIQ v1.0 &middot; Built by <b style={{ color: 'var(--ink)' }}>ResolveX</b>
        </div>
      </div>
    </div>
  );
};
