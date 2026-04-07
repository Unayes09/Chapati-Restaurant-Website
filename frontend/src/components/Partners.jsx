import React from 'react';
import { useLanguage } from '../LanguageContext';

const Partners = () => {
  const { lang } = useLanguage();
  
  const title = lang === 'fr' ? 'Recommandé sur' : 'Recommended on';
  const links = {
    uberEats: 'https://www.ubereats.com/fr-en/store/chapati-indian-street-food/kuyuhkjoS5KJFKfVgnE8dw?srsltid=AfmBOooqDi8zDEUhShFfj_2S1AA4pt4WxVRF2jvEYE4qSUcU-ZG2k81n',
    facebook: 'https://www.facebook.com/chapatistmalo/',
    google: 'https://www.google.com/maps/place/Chapati+Indian+Street+Food/@48.6508792,-2.0274322,17z/data=!3m2!4b1!5s0x480e81102eaf7361:0x40862883990f3c56!4m6!3m5!1s0x480e813849da609b:0x9fe138b2d03437b0!8m2!3d48.6508792!4d-2.0248573!16s%2Fg%2F11s45t_cbx?entry=ttu&g_ep=EgoyMDI2MDQwNS4wIKXMDSoASAFQAw%3D%3D',
  };

  return (
    <section className="partners">
      <div className="container">
        <h3 className="partners-title">{title}</h3>
        <div className="partners-grid">
          <a href={links.uberEats} target="_blank" rel="noreferrer" aria-label="Uber Eats">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b3/Uber_Eats_2020_logo.svg" alt="Uber Eats" className="partner-logo uber-eats" />
          </a>
          <a href={links.google} target="_blank" rel="noreferrer" aria-label="Google">
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="partner-logo google" />
          </a>
          <a href={links.facebook} target="_blank" rel="noreferrer" className="partner-facebook" aria-label="Facebook">
            <span className="facebook-circle">f</span>
            <span className="facebook-text">Facebook</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Partners;
