import React from 'react';
import { useLanguage } from '../LanguageContext';

const Concept = () => {
  const { t } = useLanguage();

  const handleOrderClick = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', 'fullmenu');
    window.location.href = url.toString();
  };

  return (
    <section className="concept section-padding">
      <div className="container">
        <div className="concept-grid">
          <div className="concept-text">
            <span className="label">{t.concept.label}</span>
            <h2>{t.concept.title}</h2>
            <p>{t.concept.description}</p>
            <div className="concept-buttons">
              <button className="btn-primary" onClick={handleOrderClick}>{t.hero.order}</button>
            </div>
          </div>
          <div className="concept-image">
            <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Restaurant Interior" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Concept;
