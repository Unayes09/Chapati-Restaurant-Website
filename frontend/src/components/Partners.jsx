import React from 'react';
import { useLanguage } from '../LanguageContext';

const Partners = () => {
  const { lang } = useLanguage();
  
  const title = lang === 'fr' ? 'Recommandé sur' : 'Recommended on';

  return (
    <section className="partners">
      <div className="container">
        <h3 className="partners-title">{title}</h3>
        <div className="partners-grid">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b3/Uber_Eats_2020_logo.svg" alt="Uber Eats" className="partner-logo uber-eats" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="partner-logo google" />
          <div className="partner-facebook">
            <span className="facebook-circle">f</span>
            <span className="facebook-text">Facebook</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
