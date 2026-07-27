import React from 'react';
import { useApp } from '../../context/AppContext';

export const Sidebar = () => {
  const {
    activeView, showView, currentUser,
    isMobileMenuOpen, setIsMobileMenuOpen,
    sessionCountdown
  } = useApp();

  if (!currentUser) return null;

  const role = currentUser.role;

  const navItems = [
    {
      id: 'dashboard', label: 'Dashboard', roles: ['admin', 'cashier'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
    },
    {
      id: 'pos', label: 'New Sale', roles: ['admin', 'cashier'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M2 11h20M7 15h.01M11 15h4" /></svg>
    },
    {
      id: 'receipts', label: 'Receipts', roles: ['admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l3 3v17l-2-1-2 1-2-1-2 1-2-1-2 1V2Z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>
    },
    {
      id: 'upload', label: 'Upload Receipt', roles: ['admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
    },
    {
      id: 'inventory', label: 'Inventory', roles: ['admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></svg>
    },
    {
      id: 'suppliers', label: 'Suppliers', roles: ['admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6M9 12h.01M15 12h.01M12 12h.01" /></svg>
    },
    {
      id: 'employees', label: 'Employees', roles: ['admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M17 8.2a3 3 0 1 1 3 4.6M21 20c0-2.7-1.8-4.7-4-5.3" /></svg>
    },
    {
      id: 'reports', label: 'Reports', roles: ['admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19h16M7 19v-6M12 19V6M17 19v-10" /></svg>
    },
    {
      id: 'ai', label: 'AI Assistant', roles: ['admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="7" width="16" height="12" rx="3" /><path d="M9 12h.01M15 12h.01M8 3l1 4M16 3l-1 4" /></svg>
    },
    {
      id: 'audit', label: 'Audit Log', roles: ['admin'],
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6M9 16h6M9 8h6M5 3h14v18l-4-2-3 2-3-2-4 2Z" /></svg>
    },
    {
      id: 'settings', label: 'Settings', roles: ['admin', 'cashier'], isSepAfter: false,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" /></svg>
    }
  ];

  return (
    <>
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">M</div>
          <div className="brand-text">SpareIQ <span>Parts Intelligence</span></div>
        </div>

        {navItems.map((item, idx) => {
          if (!item.roles.includes(role)) return null;
          const isSettings = item.id === 'settings';
          return (
            <React.Fragment key={item.id}>
              {isSettings && <div className="nav-sep" />}
              <button
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => showView(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            </React.Fragment>
          );
        })}

        <div className="sidebar-foot">
          <div className="pin-badge">
            <span className="dot-online"></span>
            <span>
              {sessionCountdown <= 20 && sessionCountdown > 0
                ? `Auto-logout in ${sessionCountdown}s`
                : 'Local · offline-first'}
            </span>
          </div>
          <div style={{ textAlign: 'center', fontSize: '10.5px', color: 'var(--muted)', marginTop: '10px', letterSpacing: '.02em' }}>
            SpareIQ v1.0 &middot; Built by <b>ResolveX</b>
          </div>
        </div>
      </aside>

      <div
        className={`sidebar-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};
