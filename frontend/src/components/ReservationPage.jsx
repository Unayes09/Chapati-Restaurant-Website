import React, { useMemo, useEffect, useState } from 'react';
import { useLanguage } from '../LanguageContext';

const openingHours = {
  0: [{ start: '11:30', end: '14:15' }, { start: '18:30', end: '22:45' }], // Sun
  1: [{ start: '11:30', end: '14:15' }, { start: '18:30', end: '22:45' }], // Mon
  2: [{ start: '11:30', end: '14:15' }, { start: '18:30', end: '22:45' }], // Tue
  3: [{ start: '11:30', end: '14:15' }, { start: '18:30', end: '22:45' }], // Wed
  4: [{ start: '11:30', end: '14:15' }, { start: '18:30', end: '23:45' }], // Thu
  5: [{ start: '11:30', end: '14:15' }, { start: '18:30', end: '23:45' }], // Fri
  6: [{ start: '11:30', end: '14:15' }, { start: '18:30', end: '23:45' }], // Sat
};

const getParisNow = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
};

const toDateInputValue = (date) => {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const generateTimeSlots = (selectedDate) => {
  if (!selectedDate) return [];
  const dateObj = new Date(selectedDate);
  if (isNaN(dateObj.getTime())) return [];

  const franceNow = getParisNow();
  const isTodayInFrance = dateObj.toDateString() === franceNow.toDateString();
  const dayOfWeek = dateObj.getDay();
  const schedule = openingHours[dayOfWeek] || [];
  const slots = [];

  schedule.forEach((range) => {
    let current = new Date(dateObj);
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);

    current.setHours(startH, startM, 0, 0);

    const end = new Date(dateObj);
    end.setHours(endH, endM, 0, 0);

    while (current <= end) {
      let isAvailable = true;
      if (isTodayInFrance) {
        const minBookingTime = new Date(franceNow.getTime() + 30 * 60000);
        if (current < minBookingTime) isAvailable = false;
      }

      if (isAvailable) {
        slots.push(current.toTimeString().substring(0, 5));
      }

      current.setMinutes(current.getMinutes() + 15);
    }
  });

  return slots;
};

const ReservationPage = () => {
  const { lang } = useLanguage();
  const isFr = lang === 'fr';

  const minDate = useMemo(() => toDateInputValue(getParisNow()), []);
  const maxDate = useMemo(() => {
    const now = getParisNow();
    const future = new Date(now);
    future.setFullYear(future.getFullYear() + 3);
    return toDateInputValue(future);
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    additionalInfo: '',
    tableSize: '2',
    date: minDate,
    time: '',
  });

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
        additionalInfo: parsed?.additionalInfo || prev.additionalInfo,
      }));
    } catch {
      return;
    }
  }, []);

  const timeSlots = useMemo(() => generateTimeSlots(formData.date), [formData.date]);

  useEffect(() => {
    if (!formData.time && timeSlots.length > 0) {
      setFormData((prev) => ({ ...prev, time: timeSlots[0] }));
    }
  }, [timeSlots, formData.time]);

  const isFormValid = formData.name && formData.email && formData.phone && formData.date && formData.time;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitReservation = async (e) => {
    if (e) e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    const payload = {
      customer: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
      table: { size: formData.tableSize },
      bookingDate: formData.date,
      bookingTime: formData.time,
      additionalInfo: formData.additionalInfo,
      items: [],
      totalAmount: 0,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation');
      }

      localStorage.setItem(
        'chapatiCustomerInfo',
        JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          additionalInfo: formData.additionalInfo,
        }),
      );

      setShowSuccessModal(true);
      setFormData((prev) => ({
        ...prev,
        tableSize: '2',
        date: minDate,
        time: '',
      }));
    } catch (error) {
      alert(isFr ? `Erreur: ${error.message}` : `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="order-page">
      <div className="container">
        <div className="order-card">
          <div className="order-header">
            <h2>{isFr ? 'Réservation' : 'Reservation'}</h2>
            <p>
              {isFr
                ? 'Réservez une table (2, 4, 6, 8 personnes).'
                : 'Reserve a table (2, 4, 6, 8 persons).'}
            </p>
          </div>

          <form className="booking-form-container" onSubmit={submitReservation}>
            <div className="booking-form-group">
              <label>{isFr ? 'Nom complet *' : 'Full Name *'}</label>
              <input
                type="text"
                name="name"
                required
                className="booking-input"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={isFr ? 'Jean Dupont' : 'John Doe'}
              />
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Email *' : 'Email *'}</label>
              <input
                type="email"
                name="email"
                required
                className="booking-input"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
              />
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Téléphone *' : 'Phone *'}</label>
              <input
                type="tel"
                name="phone"
                required
                className="booking-input"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Taille de la table *' : 'Table Size *'}</label>
              <select
                name="tableSize"
                className="booking-select"
                value={formData.tableSize}
                onChange={handleInputChange}
              >
                <option value="2">2 {isFr ? 'personnes' : 'persons'}</option>
                <option value="4">4 {isFr ? 'personnes' : 'persons'}</option>
                <option value="6">6 {isFr ? 'personnes' : 'persons'}</option>
                <option value="8">8 {isFr ? 'personnes' : 'persons'}</option>
              </select>
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Date *' : 'Date *'}</label>
              <input
                type="date"
                name="date"
                className="booking-input"
                required
                value={formData.date}
                min={minDate}
                max={maxDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value, time: '' }))}
              />
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Heure *' : 'Time *'}</label>
              <select
                name="time"
                required
                className="booking-select"
                value={formData.time}
                onChange={handleInputChange}
              >
                <option value="">{isFr ? 'Choisir une heure' : 'Select a time'}</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {timeSlots.length === 0 && (
                <p style={{ fontSize: '12px', color: 'red', marginTop: '10px' }}>
                  {isFr ? 'Aucun créneau disponible pour cette date.' : 'No slots available for this date.'}
                </p>
              )}
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Infos complémentaires' : 'Additional Info'}</label>
              <textarea
                name="additionalInfo"
                className="booking-textarea"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                placeholder={isFr ? 'Allergies, occasion spéciale...' : 'Allergies, special occasion...'}
              ></textarea>
            </div>

            <div className="order-actions">
              <a href="/?page=fullmenu" className="btn-back-menu">
                ← {isFr ? 'Voir le menu' : 'View Menu'}
              </a>
              <button className="btn-checkout" type="submit" disabled={!isFormValid || isLoading}>
                {isLoading ? (isFr ? 'Envoi...' : 'Sending...') : (isFr ? 'Réserver' : 'Reserve')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={`success-modal-overlay ${showSuccessModal ? 'open' : ''}`}
        onClick={() => setShowSuccessModal(false)}
      >
        <div className="success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3>{isFr ? 'Demande envoyée !' : 'Request sent!'}</h3>
          <p>
            {isFr
              ? 'Merci ! Votre réservation est confirmée. Vous recevrez un e-mail avec les détails.'
              : 'Thank you! Your reservation is confirmed. You will receive an email with the details.'}
          </p>
          <button className="btn-modal-close" onClick={() => setShowSuccessModal(false)}>
            {isFr ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReservationPage;
