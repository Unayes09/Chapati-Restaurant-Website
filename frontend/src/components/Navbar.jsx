import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import logo from '../assets/chapati.jpeg';
import gbFlag from '../assets/gb.png';
import frFlag from '../assets/fr.png';

const Navbar = () => {
  const { t, lang, toggleLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <div className="logo-container">
          <img src={logo} alt="Chapati Logo" className="logo" />
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            <li><a href="#home" className="active" onClick={closeMenu}>{t.navbar.home}</a></li>
            <li><a href="#menu" onClick={closeMenu}>{t.navbar.menu}</a></li>
            <li><a href="#foodtruck" onClick={closeMenu}>{t.navbar.foodTruck}</a></li>
            <li><a href="#contact" onClick={closeMenu}>{t.navbar.contact}</a></li>
            <li>
              <a href="#delivery" className="has-dropdown" onClick={closeMenu}>
                {t.navbar.delivery}
                <span className="dropdown-arrow">⌄</span>
              </a>
            </li>
          </ul>

          <div className="nav-actions">
            <button className="lang-toggle" onClick={() => { toggleLanguage(); closeMenu(); }}>
              {lang === 'fr' ? (
                <span className="lang-icon">
                  <img src={gbFlag} alt="English" className="flag-img" />
                  GB
                </span>
              ) : (
                <span className="lang-icon">
                  <img src={frFlag} alt="Français" className="flag-img" />
                  FR
                </span>
              )}
            </button>
            <button className="btn-order-pill" onClick={closeMenu}>{t.navbar.order}</button>
          </div>
        </div>

        <button className="mobile-toggle" onClick={toggleMenu}>
          <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
