import React from 'react';
import frFlag from '../assets/fr.png';
import gbFlag from '../assets/gb.png';
import { useAdminLanguage } from '../AdminLanguageContext.jsx';

const Navbar = ({ onLogout, onRefresh, sectionKey }) => {
  const { lang, setLang, t } = useAdminLanguage();

  const heading = sectionKey ? t(`nav.${sectionKey}`) : t('top.adminTitle');

  return (
    <nav className="admin-nav admin-nav--topbar">
      <div className="nav-content">
        <div className="nav-brand">
          {!sectionKey && <span className="brand-dot" />}
          <h1>{heading}</h1>
          {sectionKey && <p className="nav-section-hint">{t('top.controlCenter')}</p>}
        </div>
        <div className="nav-actions">
          <div className="admin-lang-toggle" role="group" aria-label={t('login.langLabel')}>
            <button
              type="button"
              className={`admin-lang-btn ${lang === 'fr' ? 'is-active' : ''}`}
              onClick={() => setLang('fr')}
              aria-pressed={lang === 'fr'}
              title="Français"
            >
              <img src={frFlag} alt="" width="22" height="16" />
            </button>
            <button
              type="button"
              className={`admin-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              title="English"
            >
              <img src={gbFlag} alt="" width="22" height="16" />
            </button>
          </div>
          <button type="button" onClick={onRefresh} className="btn-icon-label btn-refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            <span>{t('top.refresh')}</span>
          </button>
          <button type="button" onClick={onLogout} className="btn-logout-minimal">
            {t('top.logout')}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
