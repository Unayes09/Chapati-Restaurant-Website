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
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook" className="partner-logo facebook" />
        </div>
      </div>
    </section>
  );
};

export default Partners;
