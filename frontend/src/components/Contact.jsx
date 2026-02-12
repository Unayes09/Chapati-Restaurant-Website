import React from 'react';
import { useLanguage } from '../LanguageContext';

const Contact = () => {
  const { t } = useLanguage();

  return (
    <section className="contact section-padding" id="contact">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-form-section">
            <h2>{t.contact.title}</h2>
            <form className="contact-form">
              <div className="form-group">
                <input type="text" placeholder={t.contact.fields.name} required />
              </div>
              <div className="form-group">
                <input type="email" placeholder={t.contact.fields.email} required />
              </div>
              <div className="form-group">
                <input type="text" placeholder={t.contact.fields.phone} />
              </div>
              <div className="form-group">
                <textarea placeholder={t.contact.fields.message} rows="5" required></textarea>
              </div>
              <button type="submit" className="btn-primary">{t.contact.fields.send}</button>
            </form>
          </div>

          <div className="contact-info-section">
            <h2>{t.contact.info.title}</h2>
            <div className="info-item">
              <span className="icon">📞</span>
              <p>{t.contact.info.phone}</p>
            </div>
            <div className="info-item">
              <span className="icon">✉️</span>
              <p>{t.contact.info.email}</p>
            </div>
            <div className="info-item">
              <span className="icon">📍</span>
              <div>
                <p>{t.contact.info.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
