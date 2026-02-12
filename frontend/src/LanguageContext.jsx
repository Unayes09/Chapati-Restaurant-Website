import React, { createContext, useState, useContext, useEffect } from 'react';
import config from './config.json';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('fr');
  const t = config.translations[lang];

  useEffect(() => {
    // Apply colors from config.json to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', config.colors.primary);
    root.style.setProperty('--color-secondary', config.colors.secondary);
    root.style.setProperty('--color-dark', config.colors.dark);
    root.style.setProperty('--color-light', config.colors.light);
  }, []);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'fr' ? 'en' : 'fr'));
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage, restaurantName: config.restaurantName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
