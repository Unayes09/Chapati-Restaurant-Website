import React from 'react';

const BookingCard = ({ booking, onUpdateStatus }) => {
  const { customer, table, bookingDate, bookingTime, additionalInfo, items, totalAmount, status, _id } = booking;

  return (
    <div className={`booking-card-modern ${status}`}>
      <div className="card-top">
        <div className="customer-info">
          <h3>{customer.name}</h3>
          <div className="contact-links">
            <a href={`mailto:${customer.email}`}>{customer.email}</a>
            <a href={`tel:${customer.phone}`}>{customer.phone}</a>
          </div>
        </div>
        <div className="booking-status-tag">
          <span className={`badge-pill ${status}`}>{status}</span>
        </div>
      </div>

      <div className="card-middle">
        <div className="appointment-details">
          <div className="info-item">
            <span className="label">Date</span>
            <span className="value">{bookingDate}</span>
          </div>
          <div className="info-item">
            <span className="label">Time</span>
            <span className="value">{bookingTime}</span>
          </div>
          <div className="info-item">
            <span className="label">Table</span>
            <span className="value">For {table.size}</span>
          </div>
        </div>
        
        {additionalInfo && (
          <div className="admin-note">
            <strong>Note:</strong> {additionalInfo}
          </div>
        )}
      </div>

      <div className="card-items">
        <h4>Order Summary</h4>
        <ul className="items-list">
          {items.map((item, idx) => (
            <li key={idx}>
              <span className="item-qty">{item.qty}x</span>
              <span className="item-name">{item.label}</span>
              <span className="item-price">{item.price ? `€${(item.price * item.qty).toFixed(2)}` : 'TBD'}</span>
            </li>
          ))}
        </ul>
        <div className="total-row">
          <span>Total Amount</span>
          <span className="grand-total">€{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {status === 'pending' && (
        <div className="card-actions">
          <button 
            className="btn-action btn-approve" 
            onClick={() => onUpdateStatus(_id, 'confirmed')}
          >
            Confirm
          </button>
          <button 
            className="btn-action btn-decline" 
            onClick={() => onUpdateStatus(_id, 'rejected')}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
