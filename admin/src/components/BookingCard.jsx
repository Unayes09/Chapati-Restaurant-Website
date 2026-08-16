import React, { useMemo, useState } from 'react';
import { useAdminLanguage } from '../AdminLanguageContext.jsx';
import { formatItemLabelForDisplay } from '../utils/spiceLevels.js';

const escapeHtml = (value) => {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const BookingCard = ({ booking, onReceive, onReject, onCollected }) => {
  const { t, lang } = useAdminLanguage();
  const isFr = lang === 'fr';
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

  const createdDateTimeText = useMemo(() => {
    if (!createdAt) return '';
    return new Date(createdAt).toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [createdAt]);

  const reservationDateTimeText = useMemo(() => {
    if (!bookingDate && !bookingTime) return '';
    if (bookingDate && bookingTime) return `${bookingDate} • ${bookingTime}`;
    return bookingDate || bookingTime;
  }, [bookingDate, bookingTime]);

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

    // A standalone document is more reliable than printing the admin DOM on mobile.
    // Open synchronously from the click so mobile popup blockers allow it.
    const printWindow = window.open('', '_blank', 'width=420,height=760');
    if (!printWindow) {
      window.alert(t('bookingCard.printFailed'));
      return;
    }

    const receiptItems = Array.isArray(items) ? items : [];
    const itemRows = receiptItems
      .map((item) => {
        const qty = Number(item?.qty) || 0;
        const label = escapeHtml(formatItemLabelForDisplay(item?.label, isFr) || '-');
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

    const noteBlock = additionalInfo
      ? `<p><strong>Note:</strong> ${escapeHtml(additionalInfo)}</p>`
      : '';

    const printButtonLabel = isFr ? 'Imprimer le reçu' : 'Print receipt';
    const receiptHtml = `<!doctype html>
      <html lang="${isFr ? 'fr' : 'en'}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>Receipt ${escapeHtml(orderCode || _id)}</title>
        <style>
          @page { size: 80mm auto; margin: 2mm 1.5mm; }
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            min-width: 0;
            min-height: 0;
            height: auto;
            background: #fff;
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
          }
          body {
            width: 100%;
            padding: 12px;
          }
          .receipt {
            width: 100%;
            max-width: 77mm;
            margin: 0 auto;
            font-size: 11px;
            line-height: 1.35;
            background: #fff;
          }
          .top { text-align: center; margin-bottom: 6px; }
          .brand { font-size: 15px; font-weight: 700; margin: 0; }
          .line { border-top: 1px dashed #111; margin: 6px 0; }
          .meta p { margin: 2px 0; font-size: 10px; overflow-wrap: anywhere; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
          th, td { font-size: 10px; padding: 2px 0; vertical-align: top; }
          th { text-align: left; border-bottom: 1px solid #111; }
          .qty { width: 22px; }
          .name { padding-right: 3px; word-break: break-word; overflow-wrap: anywhere; white-space: normal; }
          .price { width: 52px; text-align: right; white-space: nowrap; }
          .sum-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
          }
          .sum-row.total { font-size: 13px; font-weight: 700; margin-top: 8px; }
          .foot { text-align: center; margin-top: 10px; font-size: 9px; }
          .print-action {
            display: block;
            width: min(77mm, calc(100% - 24px));
            margin: 18px auto;
            padding: 12px;
            border: 0;
            border-radius: 8px;
            background: #334155;
            color: #fff;
            font: 700 15px Arial, sans-serif;
          }
          @media print {
            html, body {
              width: 77mm !important;
              max-width: 77mm !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
            }
            body { padding: 0 !important; }
            .receipt {
              width: 77mm !important;
              max-width: 77mm !important;
              margin: 0 !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .print-action { display: none !important; }
          }
        </style>
      </head>
      <body>
        <main class="receipt">
          <div class="top">
            <p class="brand">Chapati Delivery</p>
          </div>
          <div class="meta">
            <p><strong>Name:</strong> ${escapeHtml(customer?.name || '-')}</p>
            <p><strong>Code:</strong> ${escapeHtml(orderCode || _id)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(customer?.phone || '-')}</p>
            <p><strong>Placed:</strong> ${escapeHtml(orderCreatedAt)}</p>
            ${noteBlock}
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
          <div class="sum-row total">
            <span>Grand Total</span>
            <span>€${computedTotal.toFixed(2)}</span>
          </div>
          <div class="line"></div>
          <p class="foot">Thank you - Chapati Delivery</p>
        </main>
        <button class="print-action" type="button" onclick="window.print()">
          ${printButtonLabel}
        </button>
      </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();

    let printStarted = false;
    const triggerPrint = () => {
      if (printStarted || printWindow.closed) return;
      printStarted = true;
      printWindow.setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // The standalone receipt remains open with a manual Print button.
        }
      }, 500);
    };

    printWindow.addEventListener('load', triggerPrint, { once: true });
    if (printWindow.document.readyState === 'complete') {
      triggerPrint();
    }
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
          {(createdDateTimeText || reservationDateTimeText) && (
            <div className="booking-row-details-meta">
              {isPickup && createdDateTimeText && (
                <p>
                  <strong>{t('bookingCard.orderDateTime')}:</strong> {createdDateTimeText}
                </p>
              )}
              {!isPickup && reservationDateTimeText && (
                <p>
                  <strong>{t('bookingCard.reservationDateTime')}:</strong> {reservationDateTimeText}
                </p>
              )}
              {!isPickup && createdDateTimeText && (
                <p>
                  <strong>{t('orders.createdDate')}:</strong> {createdDateTimeText}
                </p>
              )}
            </div>
          )}

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
                      <span className="booking-row-item-name">
                        {formatItemLabelForDisplay(item.label, isFr)}
                      </span>
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
