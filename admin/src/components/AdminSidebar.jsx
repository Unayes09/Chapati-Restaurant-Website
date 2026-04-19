import React from 'react';
import { useAdminLanguage } from '../AdminLanguageContext.jsx';

const IconOrders = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" />
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const IconMessages = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

const NAV_IDS = ['orders', 'reservations', 'messages', 'analytics'];
const ICONS = { orders: IconOrders, reservations: IconCalendar, messages: IconMessages, analytics: IconChart };

const AdminSidebar = ({ activeTab, onNavigate }) => {
  const { t } = useAdminLanguage();

  return (
    <aside className="admin-sidebar" aria-label="Main navigation">
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-logo" aria-hidden />
        <div>
          <div className="admin-sidebar-title">Chapati 35</div>
          <div className="admin-sidebar-sub">{t('nav.brandSub')}</div>
        </div>
      </div>
      <nav className="admin-sidebar-nav">
        {NAV_IDS.map((id) => {
          const icon = ICONS[id];
          return (
            <button
              key={id}
              type="button"
              className={`admin-sidebar-link ${activeTab === id ? 'is-active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <span className="admin-sidebar-link-icon">{React.createElement(icon)}</span>
              <span className="admin-sidebar-link-text">{t(`nav.${id}`)}</span>
              {activeTab === id && <span className="admin-sidebar-link-glow" aria-hidden />}
            </button>
          );
        })}
      </nav>
      <div className="admin-sidebar-footer">
        <span className="admin-sidebar-dot" aria-hidden />
        {t('nav.livePanel')}
      </div>
    </aside>
  );
};

export default AdminSidebar;
