import React from 'react';
import { useLanguage } from '../LanguageContext';
import logo from '../assets/chapati.jpeg';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer-contact-combined" id="contact">
      <div className="container">
        <div className="footer-layout">
          {/* Column 1: Brand & Social */}
          <div className="footer-column footer-brand">
            <img src={logo} alt="Chapati Logo" className="logo" />
            <p>{t.footer.description}</p>
            <div className="footer-social">
              <a href="#" className="social-icon">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
                  alt="Facebook"
                  className="social-icon-img"
                />
              </a>
              <a
                href="https://instagram.com/chapati_indianstreetfood"
                className="social-icon"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
                  alt="Instagram"
                  className="social-icon-img"
                />
              </a>
              <a href="#" className="social-icon">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                  alt="Google"
                  className="social-icon-img"
                />
              </a>
            </div>
          </div>

          {/* Column 2: Contact Form */}
          <div className="footer-column">
            <h4>{t.contact.title}</h4>
            <form className="footer-form">
              <input type="text" placeholder={t.contact.fields.name} required />
              <input type="email" placeholder={t.contact.fields.email} required />
              <input type="text" placeholder={t.contact.fields.phone} />
              <textarea placeholder={t.contact.fields.message} required></textarea>
  
              <button type="submit" className="btn-send">{t.contact.fields.send}</button>
            </form>
          </div>

          {/* Column 3: Commander + Payment */}
          <div className="footer-column">
            <h4>COMMANDER</h4>
            <div className="commander-links">
              <a href="#" className="commander-link">Click & Collect</a>
              <a href="#" className="commander-link">Uber Eats</a>
              <a href="#" className="btn-commander-large">{t.hero.order}</a>
            </div>

            <h4 style={{ marginTop: '40px', marginBottom: '20px' }}>{t.footer.payment.title}</h4>
            <div className="payment-list">
              <div className="payment-item">
                <span className="payment-icon">💰</span>
                <span>{t.footer.payment.methods[0]}</span>
              </div>
              <div className="payment-item">
                <span className="payment-icon">💳</span>
                <span>{t.footer.payment.methods[1]}</span>
              </div>
              <div className="payment-item">
                <span className="payment-icon">🎟️</span>
                <span>{t.footer.payment.methods[2]}</span>
              </div>
            </div>
          </div>

          {/* Column 4: Useful Info */}
          <div className="footer-column">
            <h4>{t.contact.info.title}</h4>
            <div className="info-list">
              <div className="info-item-footer">
                <span className="icon">📞</span>
                <span>{t.contact.info.phone}</span>
              </div>
              <div className="info-item-footer">
                <span className="icon">✉️</span>
                <span>{t.contact.info.email}</span>
              </div>
              <div className="info-item-footer">
                <span className="icon">📍</span>
                <span>{t.contact.info.address}</span>
              </div>
              {t.contact.info.hours && (
                <div className="info-item-footer">
                  <span className="icon">⏰</span>
                  <span>
                    {t.contact.info.hoursTitle}
                    <br />
                    {t.contact.info.hours.map((line, index) => (
                      <span key={index}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
