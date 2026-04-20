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

  const printReceipt = () => {
    if (!isPickup) return;

    const receiptItems = Array.isArray(items) ? items : [];
    const itemRows = receiptItems
      .map((item) => {
        const qty = Number(item?.qty) || 0;
        const label = item?.label || '-';
        const lineTotal = (Number(item?.price) || 0) * qty;
        return `
          <tr>
            <td class="qty">${qty}x</td>
            <td class="name">${label}</td>
            <td class="price">${lineTotal > 0 ? `€${lineTotal.toFixed(2)}` : '€0.00'}</td>
          </tr>
        `;
      })
      .join('');

    const orderCreatedAt = createdAt
      ? new Date(createdAt).toLocaleString('fr-FR', {
          timeZone: 'Europe/Paris',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '-';

    const printWindow = window.open('', '_blank', 'width=360,height=700');
    if (!printWindow) return;

    const receiptHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt ${orderCode || _id}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #111; }
            body { width: 80mm; max-width: 320px; padding: 4mm; }
            .top { text-align: center; margin-bottom: 8px; }
            .brand { font-size: 18px; font-weight: 700; margin: 0; }
            .line { border-top: 1px dashed #111; margin: 8px 0; }
            .meta p { margin: 2px 0; font-size: 12px; }
            .meta strong { font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { font-size: 12px; padding: 3px 0; vertical-align: top; }
            th { text-align: left; border-bottom: 1px solid #111; }
            .qty { width: 30px; }
            .name { width: auto; padding-right: 6px; }
            .price { width: 70px; text-align: right; white-space: nowrap; }
            .sum { margin-top: 10px; }
            .sum-row { display: flex; justify-content: space-between; font-size: 13px; margin: 3px 0; }
            .sum-row.total { font-size: 16px; font-weight: 700; margin-top: 6px; }
            .foot { text-align: center; margin-top: 12px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="top">
            <p class="brand">Chapati Delivery</p>
          </div>
          <div class="meta">
            <p><strong>Name:</strong> ${customer?.name || '-'}</p>
            <p><strong>Code:</strong> ${orderCode || _id}</p>
            <p><strong>Phone:</strong> ${customer?.phone || '-'}</p>
            <p><strong>Placed:</strong> ${orderCreatedAt}</p>
          </div>
          <div class="line"></div>
          <table>
            <thead>
              <tr>
                <th class="qty">Qty</th>
                <th class="name">Product</th>
                <th class="price">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows || '<tr><td colspan="3">No items</td></tr>'}
            </tbody>
          </table>
          <div class="line"></div>
          <div class="sum">
            <div class="sum-row total">
              <span>Grand Total</span>
              <span>€${computedTotal.toFixed(2)}</span>
            </div>
          </div>
          <div class="line"></div>
          <p class="foot">Thank you - Chapati Delivery</p>
          <script>
            window.onload = () => {
              window.print();
            };
            window.onafterprint = () => {
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

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
                <button className="btn-row btn-row-neutral" type="button" onClick={printReceipt}>
                  {t('bookingCard.printReceipt')}
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
