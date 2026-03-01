import React from 'react';

const Navbar = ({ onLogout, onRefresh }) => {
  return (
    <nav className="admin-nav">
      <div className="nav-content">
        <div className="nav-brand">
          <span className="brand-dot"></span>
          <h1>Chapati 35 Admin</h1>
        </div>
        <div className="nav-actions">
          <button onClick={onRefresh} className="btn-icon-label btn-refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
          <button onClick={onLogout} className="btn-logout-minimal">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
