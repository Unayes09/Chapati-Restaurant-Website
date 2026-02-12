import React from 'react';
import { useLanguage } from '../LanguageContext';

const Hero = () => {
  const { t } = useLanguage();

  return (
    <section className="hero" id="home">
      <div className="hero-overlay">
        <div className="container hero-content">
          <h1>{t.hero.title}</h1>
          <p>{t.hero.subtitle}</p>
          <div className="hero-buttons">
            <button className="btn-primary">{t.hero.order}</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
