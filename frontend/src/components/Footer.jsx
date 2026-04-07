import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import logo from '../assets/chapati.jpeg';

const Footer = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const clearStatusTimerRef = useRef(null);

  const goToMenu = (e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set('page', 'fullmenu');
    window.location.href = url.toString();
  };

  const links = {
    uberEats: 'https://www.ubereats.com/fr-en/store/chapati-indian-street-food/kuyuhkjoS5KJFKfVgnE8dw?srsltid=AfmBOooqDi8zDEUhShFfj_2S1AA4pt4WxVRF2jvEYE4qSUcU-ZG2k81n',
    facebook: 'https://www.facebook.com/chapatistmalo/',
    google: 'https://www.google.com/maps/place/Chapati+Indian+Street+Food/@48.6508792,-2.0274322,17z/data=!3m2!4b1!5s0x480e81102eaf7361:0x40862883990f3c56!4m6!3m5!1s0x480e813849da609b:0x9fe138b2d03437b0!8m2!3d48.6508792!4d-2.0248573!16s%2Fg%2F11s45t_cbx?entry=ttu&g_ep=EgoyMDI2MDQwNS4wIKXMDSoASAFQAw%3D%3D',
  };

  useEffect(() => {
    const raw = localStorage.getItem('chapatiCustomerInfo');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setFormData((prev) => ({
        ...prev,
        name: parsed?.name || prev.name,
        email: parsed?.email || prev.email,
        phone: parsed?.phone || prev.phone,
      }));
    } catch {
      return;
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;
    setSendResult('');
    setIsSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }

      localStorage.setItem(
        'chapatiCustomerInfo',
        JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }),
      );

      setIsSending(false);
      setSendResult('ok');
      if (clearStatusTimerRef.current) {
        clearTimeout(clearStatusTimerRef.current);
      }
      clearStatusTimerRef.current = setTimeout(() => {
        setSendResult('');
      }, 3000);
    } catch {
      setSendResult('error');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    return () => {
      if (clearStatusTimerRef.current) clearTimeout(clearStatusTimerRef.current);
    };
  }, []);

  return (
    <footer className="footer-contact-combined" id="contact">
      <div className="container">
        <div className="footer-layout">
          {/* Column 1: Brand & Social */}
          <div className="footer-column footer-brand">
            <img src={logo} alt="Chapati Logo" className="logo" />
            <p>{t.footer.description}</p>
            <div className="footer-social">
              <a href={links.facebook} className="social-icon" target="_blank" rel="noreferrer">
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
              <a href={links.google} className="social-icon" target="_blank" rel="noreferrer">
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
            <form className="footer-form" onSubmit={handleSubmit}>
              <input type="text" name="name" placeholder={t.contact.fields.name} required value={formData.name} onChange={handleInputChange} />
              <input type="email" name="email" placeholder={t.contact.fields.email} required value={formData.email} onChange={handleInputChange} />
              <input type="text" name="phone" placeholder={t.contact.fields.phone} value={formData.phone} onChange={handleInputChange} />
              <textarea name="message" placeholder={t.contact.fields.message} required value={formData.message} onChange={handleInputChange}></textarea>
  
              <button type="submit" className="btn-send" disabled={isSending}>{isSending ? 'SENDING...' : (t.contact.fields.send || 'SEND')}</button>
              {sendResult === 'ok' && (
                <div className="footer-form-status footer-form-status-ok">
                  {t.contact.fields.sent || 'Message sent'}
                </div>
              )}
              {sendResult === 'error' && (
                <div className="footer-form-status footer-form-status-error">
                  {t.contact.fields.failed || 'Failed to send'}
                </div>
              )}
            </form>
          </div>

          {/* Column 3: Commander + Payment */}
          <div className="footer-column">
            <h4>COMMANDER</h4>
            <div className="commander-links">
              <a href="#" className="commander-link">Click & Collect</a>
              <a href={links.uberEats} className="commander-link" target="_blank" rel="noreferrer">Uber Eats</a>
              <a href="/?page=fullmenu" className="btn-commander-large" onClick={goToMenu}>{t.hero.order}</a>
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
