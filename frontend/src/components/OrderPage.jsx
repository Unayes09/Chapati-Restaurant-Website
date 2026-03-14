import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';

const pickupOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

const OrderPage = () => {
  const { lang } = useLanguage();
  const isFr = lang === 'fr';

  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem('chapatiOrder');
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    additionalInfo: '',
    pickupRequestedInMinutes: '30',
  });

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 0),
        0,
      ),
    [items],
  );

  useEffect(() => {
    localStorage.setItem('chapatiOrder', JSON.stringify(items));
  }, [items]);

  const updateQty = (id, delta) => {
    setItems((prev) => {
      return prev
        .map((item) =>
          item.id === id
            ? { ...item, qty: Math.max(0, (item.qty || 0) + delta) }
            : item,
        )
        .filter((item) => item.qty > 0);
    });
  };

  const handleConfirmOrder = () => {
    setIsSidebarOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.name && formData.email && formData.phone && formData.pickupRequestedInMinutes;

  const submitBooking = async () => {
    if (!isFormValid || isLoading) return;
    
    setIsLoading(true);
    
    const payload = {
      customer: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
      pickupRequestedInMinutes: Number(formData.pickupRequestedInMinutes),
      additionalInfo: formData.additionalInfo,
      items: items.map(item => ({
        id: item.id,
        label: item.label,
        price: item.price,
        qty: item.qty
      })),
      totalAmount: total,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      // Success
      setShowSuccessModal(true);
      
      // Clear state and cart
      setItems([]);
      localStorage.removeItem('chapatiOrder');
      setIsSidebarOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        additionalInfo: '',
        pickupRequestedInMinutes: '30',
      });
    } catch (error) {
      console.error('Booking Error:', error);
      alert(isFr 
        ? `Erreur: ${error.message}` 
        : `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSubmit = (e) => {
    if (e) e.preventDefault();
    submitBooking();
  };

  return (
    <section className="order-page">
      <div className="container">
        {!items.length ? (
          <div className="order-card empty-cart">
            <span className="empty-cart-icon">🛒</span>
            <h3>{isFr ? 'Votre panier est vide' : 'Your cart is empty'}</h3>
            <p>
              {isFr
                ? 'On dirait que vous n’avez pas encore fait votre choix.'
                : 'It looks like you haven’t made your choice yet.'}
            </p>
            <a href="/?page=fullmenu" className="btn-primary">
              {isFr ? 'Voir le menu' : 'View Menu'}
            </a>
          </div>
        ) : (
          <div className="order-card">
            <div className="order-header">
              <h2>{isFr ? 'Votre Commande' : 'Your Order'}</h2>
              <p>
                {isFr 
                  ? 'Vérifiez vos articles avant de finaliser' 
                  : 'Review your items before checking out'}
              </p>
            </div>

            <div className="order-content">
              {items.map((item) => {
                const isVariablePrice = item.id === 'dessert-of-the-day';
                const lineTotal = (item.price || 0) * (item.qty || 0);
                return (
                  <div key={item.id} className="order-item-row">
                    <div className="order-item-info">
                      <h4>{item.label}</h4>
                      <p>{isFr ? 'Spécialité Chapati' : 'Chapati Specialty'}</p>
                    </div>
                    
                    <div className="order-item-price">
                      {isVariablePrice ? '-' : `€${(item.price || 0).toFixed(2)}`}
                    </div>

                    <div className="order-qty-wrapper">
                      <button
                        type="button"
                        className="order-qty-btn"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="order-qty-num">{item.qty}</span>
                      <button
                        type="button"
                        className="order-qty-btn"
                        onClick={() => updateQty(item.id, 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="order-item-total">
                      {isVariablePrice
                        ? (isFr ? 'À définir' : 'TBD')
                        : `€${lineTotal.toFixed(2)}`}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="order-footer">
              <div className="order-summary-totals">
                <div className="order-summary-row">
                  <span>Subtotal</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <div className="order-summary-row">
                  <span>{isFr ? 'Frais de service' : 'Service fee'}</span>
                  <span>€0.00</span>
                </div>
                <div className="order-summary-row grand-total">
                  <span>Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="order-actions">
                <a href="/?page=fullmenu" className="btn-back-menu">
                  ← {isFr ? 'Continuer mes achats' : 'Back to Menu'}
                </a>
                <button className="btn-checkout" onClick={handleConfirmOrder}>
                  {isFr ? 'Confirmer la commande' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Sidebar */}
      <div className={`booking-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}>
        <div className="booking-sidebar" onClick={(e) => e.stopPropagation()}>
          <div className="booking-sidebar-header">
            <h3>{isFr ? 'Détails de réservation' : 'Booking Details'}</h3>
            <button className="btn-close-sidebar" onClick={() => setIsSidebarOpen(false)}>&times;</button>
          </div>

          <form className="booking-form-container" onSubmit={handleBookingSubmit}>
            <div className="booking-form-group">
              <label>{isFr ? 'Nom complet *' : 'Full Name *'}</label>
              <input type="text" name="name" required className="booking-input" value={formData.name} onChange={handleInputChange} placeholder={isFr ? 'Jean Dupont' : 'John Doe'} />
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Email *' : 'Email *'}</label>
              <input type="email" name="email" required className="booking-input" value={formData.email} onChange={handleInputChange} placeholder="email@example.com" />
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Téléphone *' : 'Phone *'}</label>
              <input type="tel" name="phone" required className="booking-input" value={formData.phone} onChange={handleInputChange} placeholder="06 12 34 56 78" />
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Temps souhaité *' : 'Requested Pickup Time *'}</label>
              <select
                name="pickupRequestedInMinutes"
                className="booking-select"
                value={formData.pickupRequestedInMinutes}
                onChange={handleInputChange}
              >
                {pickupOptions.map((opt) => (
                  <option key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="booking-form-group">
              <label>{isFr ? 'Infos complémentaires' : 'Additional Info'}</label>
              <textarea name="additionalInfo" className="booking-textarea" value={formData.additionalInfo} onChange={handleInputChange} placeholder={isFr ? 'Allergies, occasion spéciale...' : 'Allergies, special occasion...'}></textarea>
            </div>
          </form>

          <div className="booking-sidebar-footer">
            <button 
              type="submit" 
              className="btn-book-now" 
              disabled={!isFormValid || isLoading}
              onClick={handleBookingSubmit}
            >
              {isLoading 
                ? (isFr ? 'Envoi en cours...' : 'Sending...') 
                : (isFr ? 'Réserver ma commande' : 'Book My Order')}
            </button>
          </div>
        </div>
      </div>
      {/* Success Modal */}
      <div className={`success-modal-overlay ${showSuccessModal ? 'open' : ''}`} onClick={() => setShowSuccessModal(false)}>
        <div className="success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>{isFr ? 'Commande Reçue !' : 'Order Received!'}</h3>
          <p>
            {isFr 
              ? 'Merci ! Votre commande a été envoyée. Vous recevrez un e-mail quand le restaurant confirme le temps de retrait.' 
              : 'Thank you! Your order has been sent. You will receive an email once the restaurant confirms your pickup time.'}
          </p>
          <button className="btn-modal-close" onClick={() => setShowSuccessModal(false)}>
            {isFr ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default OrderPage;
