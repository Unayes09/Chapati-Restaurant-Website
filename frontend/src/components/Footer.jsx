import React, { useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import logo from '../assets/chapati.jpeg';
import ReCAPTCHA from 'react-google-recaptcha';

const Footer = () => {
  const { t } = useLanguage();
  const recaptchaRef = useRef();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const token = recaptchaRef.current.getValue();
    if (!token) {
      alert("Please verify that you are not a robot.");
      return;
    }
    // Proceed with form submission
    console.log("Form submitted successfully with token:", token);
  };

  return (
    <footer className="footer-contact-combined" id="contact">
      <div className="container">
        <div className="footer-layout">
          {/* Column 1: Brand & Social */}
          <div className="footer-column footer-brand">
            <img src={logo} alt="Chapati Logo" className="logo" />
            <p>{t.footer.description}</p>
            <div className="footer-social">
              <a href="#" className="social-icon">f</a>
              <a href="#" className="social-icon">i</a>
              <a href="#" className="social-icon">G</a>
            </div>
          </div>

          {/* Column 2: Contact Form */}
          <div className="footer-column">
            <h4>{t.contact.title}</h4>
            <form className="footer-form" onSubmit={handleFormSubmit}>
              <input type="text" placeholder={t.contact.fields.name} required />
              <input type="email" placeholder={t.contact.fields.email} required />
              <input type="text" placeholder={t.contact.fields.phone} />
              <textarea placeholder={t.contact.fields.message} required></textarea>
              
              <div className="recaptcha-container">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Sample test key from Google
                  theme="dark"
                />
              </div>

              <button type="submit" className="btn-send">{t.contact.fields.send}</button>
            </form>
          </div>

          {/* Column 3: Commander */}
          <div className="footer-column">
            <h4>COMMANDER</h4>
            <div className="commander-links">
              <a href="#" className="commander-link">Click & Collect</a>
              <a href="#" className="commander-link">Uber Eats</a>
              
              <a href="#" className="btn-commander-large">{t.hero.order}</a>
            </div>
          </div>

          {/* Column 4: Useful Info & Payment */}
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
        </div>

        <div className="footer-bottom-bar">
          <p>{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
