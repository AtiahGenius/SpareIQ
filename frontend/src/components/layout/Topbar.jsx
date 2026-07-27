import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export const Topbar = ({ onGlobalSearch }) => {
  const {
    currentUser, logout, theme, setTheme,
    notifications, isNotifOpen, setIsNotifOpen,
    setIsMobileMenuOpen, showView
  } = useApp();

  const [searchVal, setSearchVal] = useState('');
  const searchInputRef = useRef(null);

  // Global '/' keyboard shortcut focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/') {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
        if (!currentUser) return;
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = searchVal.trim();
      if (!q) return;
      if (onGlobalSearch) onGlobalSearch(q);
      showView('receipts');
    }
  };

  const hasUnreadNotifs = notifications.length > 0;
  const userInitials = currentUser.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="topbar">
      <button
        className="icon-btn menu-toggle"
        onClick={() => setIsMobileMenuOpen(prev => !prev)}
        title="Menu"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <div className="search-shell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          ref={searchInputRef}
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search receipts, suppliers, products, amounts, invoice #..."
        />
      </div>

      <div className="topbar-actions">
        <button
          className="icon-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
          )}
        </button>

        <div className="notif-wrap">
          <button
            className="icon-btn"
            onClick={() => setIsNotifOpen(prev => !prev)}
            title="Notifications"
            aria-label="Notifications"
            aria-haspopup="true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            {hasUnreadNotifs && <span className="notif-dot" />}
          </button>

          {isNotifOpen && (
            <div className="notif-drop active">
              {notifications.length > 0 ? (
                notifications.slice(0, 15).map((n, idx) => (
                  <div key={idx} className="notif-item">
                    <div dangerouslySetInnerHTML={{ __html: n.text }} />
                    <div className="t">{new Date(n.time).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="notif-item" style={{ color: 'var(--muted)' }}>No notifications yet.</div>
              )}
            </div>
          )}
        </div>

        <div className="user-chip">
          <div className="avatar">{userInitials}</div>
          <div className="who">
            <b>{currentUser.name}</b>
            <span><span className={`badge-role ${currentUser.role}`}>{currentUser.role}</span></span>
          </div>
          <button
            className="icon-btn"
            style={{ width: '28px', height: '28px', border: 'none' }}
            title="Logout"
            aria-label="Logout"
            onClick={() => logout(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
