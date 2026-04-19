import React from 'react';
import frFlag from '../assets/fr.png';
import gbFlag from '../assets/gb.png';
import { useAdminLanguage } from '../AdminLanguageContext.jsx';

const LoginForm = ({ loginData, onChange, onSubmit, error }) => {
  const { lang, setLang, t } = useAdminLanguage();

  return (
    <div className="login-wrapper">
      <div className="login-visual">
        <div className="visual-content">
          <h2>{t('login.heroTitle')}</h2>
          <p>{t('login.heroSubtitle')}</p>
        </div>
      </div>
      <div className="login-form-side">
        <div className="form-container-inner">
          <header className="login-form-header-row">
            <div>
              <h1>{t('login.title')}</h1>
              <p>{t('login.welcome')}</p>
            </div>
            <div className="admin-lang-toggle admin-lang-toggle--login" role="group" aria-label={t('login.langLabel')}>
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
          </header>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="input-group-modern">
              <label>{t('login.email')}</label>
              <input
                type="email"
                name="email"
                placeholder={t('login.emailPh')}
                required
                value={loginData.email}
                onChange={onChange}
              />
            </div>
            <div className="input-group-modern">
              <label>{t('login.password')}</label>
              <input
                type="password"
                name="password"
                placeholder={t('login.passwordPh')}
                required
                value={loginData.password}
                onChange={onChange}
              />
            </div>
            <button type="submit" className="btn-submit-login">
              {t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
