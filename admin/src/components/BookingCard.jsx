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

    const receiptHtml = `<!doctype html>
<html lang="${isFr ? 'fr' : 'en'}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=80mm, initial-scale=1" />
    <title>Receipt ${escapeHtml(orderCode || _id)}</title>
    <style>
      @page {
        size: 80mm auto;
        margin: 1mm 1.5mm;
      }
      @media print {
        html, body {
          width: 77mm !important;
          max-width: 77mm !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: #111;
        background: #fff;
      }
      body {
        width: 77mm;
        max-width: 77mm;
        padding: 1.5mm;
        font-size: 11px;
        line-height: 1.35;
      }
      .top { text-align: center; margin-bottom: 6px; }
      .brand { font-size: 15px; font-weight: 700; margin: 0; }
      .line { border-top: 1px dashed #111; margin: 6px 0; }
      .meta p { margin: 2px 0; font-size: 10px; word-break: break-word; }
      .meta strong { font-weight: 700; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
      th, td { font-size: 10px; padding: 2px 0; vertical-align: top; }
      th { text-align: left; border-bottom: 1px solid #111; }
      .qty { width: 22px; }
      .name { word-break: break-word; overflow-wrap: anywhere; white-space: normal; padding-right: 3px; }
      .price { width: 48px; text-align: right; white-space: nowrap; }
      .sum { margin-top: 8px; }
      .sum-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; gap: 6px; }
      .sum-row.total { font-size: 13px; font-weight: 700; margin-top: 4px; }
      .foot { text-align: center; margin-top: 10px; font-size: 9px; }
    </style>
  </head>
  <body>
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
    <div class="sum">
      <div class="sum-row total">
        <span>Grand Total</span>
        <span>€${computedTotal.toFixed(2)}</span>
      </div>
    </div>
    <div class="line"></div>
    <p class="foot">Thank you - Chapati Delivery</p>
  </body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', t('bookingCard.printReceipt'));
    iframe.setAttribute('aria-hidden', 'true');
    // Non-zero size helps mobile browsers render printable content (77–80mm roll).
    iframe.style.cssText =
      'position:fixed;left:-9999px;top:0;width:80mm;height:100vh;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(iframe);

    const iframeWin = iframe.contentWindow;
    if (!iframeWin) {
      document.body.removeChild(iframe);
      window.alert(t('bookingCard.printFailed'));
      return;
    }

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    let printStarted = false;
    const triggerPrint = () => {
      if (printStarted) return;
      printStarted = true;
      window.setTimeout(() => {
        try {
          iframeWin.focus();
          iframeWin.print();
        } catch {
          window.alert(t('bookingCard.printFailed'));
          cleanup();
        }
      }, 450);
    };

    iframeWin.document.open();
    iframeWin.document.write(receiptHtml);
    iframeWin.document.close();

    iframe.addEventListener('load', triggerPrint, { once: true });
    if (iframeWin.document.readyState === 'complete') {
      triggerPrint();
    }

    iframeWin.onafterprint = cleanup;
    window.setTimeout(cleanup, 120_000);
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
