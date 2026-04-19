import React, { useMemo, useState } from 'react';
import { useAdminLanguage } from '../AdminLanguageContext.jsx';

const BookingCard = ({ booking, onReceive, onReject, onCollected }) => {
  const { t } = useAdminLanguage();
  const [expanded, setExpanded] = useState(false);
  const {
    customer,
    table,
    bookingDate,
    bookingTime,
    additionalInfo,
    items,
    totalAmount,
    status,
    _id,
    orderType,
    orderCode,
    pickupRequestedInMinutes,
    pickupConfirmedInMinutes,
    pickupReadyAt,
    createdAt,
  } = booking;

  const isPickup = orderType === 'pickup';

  const createdTimeText = useMemo(() => {
    if (!createdAt) return '';
    return new Date(createdAt).toLocaleTimeString('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [createdAt]);

  const readyAtText = useMemo(() => {
    if (!pickupReadyAt) return '';
    return new Date(pickupReadyAt).toLocaleTimeString('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [pickupReadyAt]);

  const computedTotal = useMemo(() => {
    if (typeof totalAmount === 'number') return totalAmount;
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  }, [items, totalAmount]);

  const statusLabel = status ? t(`bookingStatus.${status}`) : '';

  return (
    <div className={`booking-row ${isPickup ? 'booking-row--pickup' : 'booking-row--booking'} ${expanded ? 'is-expanded' : ''}`}>
      <div className="booking-row-main">
        <button
          type="button"
          className="booking-row-expand"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? t('bookingCard.collapse') : t('bookingCard.expand')}
        >
          {expanded ? '−' : '+'}
        </button>

        {isPickup ? (
          <>
            <div className="booking-row-code">
              <div className="booking-row-code-top">{orderCode || _id}</div>
              <div className="booking-row-code-sub">
                {t('bookingCard.pickup')} {createdTimeText ? `• ${createdTimeText}` : ''}
              </div>
            </div>

            <div className="booking-row-customer">
              <div className="booking-row-customer-name">{customer?.name}</div>
              <div className="booking-row-customer-links">
                <a href={`mailto:${customer?.email}`}>{customer?.email}</a>
                <a href={`tel:${customer?.phone}`}>{customer?.phone}</a>
              </div>
            </div>

            <div className="booking-row-meta">
              <div className="booking-row-chip">
                {t('bookingCard.req')}: {pickupRequestedInMinutes ? `${pickupRequestedInMinutes}m` : '-'}
              </div>
              <div className="booking-row-chip">
                {t('bookingCard.conf')}: {pickupConfirmedInMinutes ? `${pickupConfirmedInMinutes}m` : '-'}
              </div>
              <div className="booking-row-chip">
                {t('bookingCard.ready')}: {readyAtText || '-'}
              </div>
            </div>

            <div className="booking-row-status">
              <span className={`badge-pill ${status}`}>{statusLabel}</span>
            </div>

            <div className="booking-row-total">€{computedTotal.toFixed(2)}</div>
          </>
        ) : (
          <>
            <div className="booking-row-code">
              <div className="booking-row-code-top">{bookingDate || '-'}</div>
              <div className="booking-row-code-sub">{bookingTime || '-'}</div>
            </div>

            <div className="booking-row-name">{customer?.name || '-'}</div>
            <div className="booking-row-email">
              <a href={`mailto:${customer?.email}`}>{customer?.email || '-'}</a>
            </div>
            <div className="booking-row-phone">
              <a href={`tel:${customer?.phone}`}>{customer?.phone || '-'}</a>
            </div>

            <div className="booking-row-meta">
              <div className="booking-row-chip">
                {table?.size ? `${t('bookingCard.table')} ${table.size}` : '-'}
              </div>
            </div>

            <div className="booking-row-status">
              {status === 'rejected' && <span className={`badge-pill ${status}`}>{statusLabel}</span>}
            </div>
          </>
        )}

        {isPickup && (
          <div className="booking-row-actions">
            {status === 'pending' && (
              <>
                <button className="btn-row btn-row-primary" type="button" onClick={() => onReceive(booking)}>
                  {t('bookingCard.receive')}
                </button>
                <button className="btn-row btn-row-danger" type="button" onClick={() => onReject(_id)}>
                  {t('bookingCard.reject')}
                </button>
              </>
            )}

            {status === 'received' && (
              <>
                <button className="btn-row btn-row-primary" type="button" onClick={() => onCollected(_id)}>
                  {t('bookingCard.collected')}
                </button>
                <button className="btn-row btn-row-danger" type="button" onClick={() => onReject(_id)}>
                  {t('bookingCard.reject')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="booking-row-details">
          {additionalInfo && (
            <div className="booking-row-note">
              <strong>{t('bookingCard.note')}:</strong> {additionalInfo}
            </div>
          )}

          {Array.isArray(items) && items.length > 0 && (
            <div className="booking-row-items">
              <div className="booking-row-items-title">{t('bookingCard.items')}</div>
              <div className="booking-row-items-list">
                {items.map((item, idx) => (
                  <div key={idx} className="booking-row-item">
                    <div className="booking-row-item-left">
                      <span className="booking-row-item-qty">{item.qty}x</span>
                      <span className="booking-row-item-name">{item.label}</span>
                    </div>
                    <div className="booking-row-item-right">
                      {item.price ? `€${(Number(item.price) * Number(item.qty)).toFixed(2)}` : t('bookingCard.tbd')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingCard;
