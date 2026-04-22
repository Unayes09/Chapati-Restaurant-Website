import React, { createContext, useState, useContext, useEffect } from 'react';
import config from './config.json';

const LanguageContext = createContext();
const LANGUAGE_STORAGE_KEY = 'chapati_lang';

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return storedLang === 'en' || storedLang === 'fr' ? storedLang : 'fr';
  });
  const t = config.translations[lang];

  useEffect(() => {
    // Apply colors from config.json to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', config.colors.primary);
    root.style.setProperty('--color-secondary', config.colors.secondary);
    root.style.setProperty('--color-dark', config.colors.dark);
    root.style.setProperty('--color-light', config.colors.light);
  }, []);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, [lang]);

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
