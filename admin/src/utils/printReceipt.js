import { formatItemLabelForDisplay } from './spiceLevels.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const buildReceiptHtml = (b, { isFr = false, t = (k) => k } = {}) => {
  const safeItems = Array.isArray(b?.items) ? b.items : [];
  const totalAmount =
    typeof b?.totalAmount === 'number'
      ? b.totalAmount
      : safeItems.reduce(
          (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0),
          0
        );

  const itemRows = safeItems
    .map((it) => {
      const qty = Number(it.qty) || 0;
      const price = Number(it.price) || 0;
      const line = price * qty;
      const label = escapeHtml(formatItemLabelForDisplay(it.label, isFr) || '-');
      return (
        `<tr>` +
        `<td class="qty">${qty}x</td>` +
        `<td class="name">${label}</td>` +
        `<td class="amt">${line > 0 ? '€' + line.toFixed(2) : '€0.00'}</td>` +
        `</tr>`
      );
    })
    .join('');

  const noteBlock = b?.additionalInfo
    ? `<div class="row note"><span class="label">${t('bookingCard.note')}</span><span class="value">${escapeHtml(b.additionalInfo)}</span></div>`
    : '';

  const printButtonLabel = t('bookingCard.printReceipt');
  const langAttr = isFr ? 'fr' : 'en';

  const css = [
    '@page{size:80mm auto;margin:0;}',
    '*{box-sizing:border-box;}',
    'html,body{margin:0;padding:0;background:#f1f5f9;color:#0f172a;',
    'font-family:Arial,Helvetica,sans-serif;',
    '-webkit-print-color-adjust:exact;print-color-adjust:exact;}',
    'body{padding:14px;font-size:16px;line-height:1.5;}',
    '.receipt{background:#fff;width:min(80mm,100%);margin:0 auto;',
    'padding:14px 16px 18px;border:1px dashed #cbd5e1;border-radius:6px;',
    'box-shadow:0 4px 12px rgba(15,23,42,.08);}',
    '.brand{font:700 24px Georgia,"Times New Roman",serif;',
    'text-align:center;letter-spacing:.04em;margin:0 0 14px;}',
    '.row{display:flex;justify-content:space-between;align-items:flex-start;',
    'gap:10px;margin:7px 0;line-height:1.4;font-size:17px;}',
    '.row .label{font-weight:700;flex:0 0 auto;}',
    '.row .value{text-align:right;word-break:break-word;flex:1 1 auto;}',
    '.row.big{font-size:18px;margin:10px 0;}',
    '.row.note{font-size:16px;align-items:flex-start;}',
    '.row.note .value{font-style:italic;font-weight:600;}',
    '.line{border-top:1px dashed #94a3b8;margin:12px 0;height:0;}',
    'table{width:100%;border-collapse:collapse;margin-top:6px;}',
    'th{text-align:left;font-weight:700;padding:7px 4px;font-size:16px;',
    'border-bottom:1px solid #0f172a;}',
    'th.amt{text-align:right;}',
    'td{padding:8px 4px;vertical-align:top;font-size:18px;line-height:1.35;',
    'border-bottom:1px dotted #cbd5e1;}',
    'td.qty{width:48px;font-weight:700;}',
    'td.name{word-break:break-word;}',
    'td.amt{text-align:right;white-space:nowrap;font-weight:600;}',
    '.total-row{display:flex;justify-content:space-between;align-items:baseline;',
    'font:700 22px Arial,Helvetica,sans-serif;margin-top:14px;padding-top:10px;',
    'border-top:2px solid #0f172a;}',
    '.total-row .amt{font-size:24px;}',
    '.foot{text-align:center;font-size:14px;color:#475569;margin:16px 0 0;',
    'font-weight:600;}',
    '.print-action{display:block;width:min(80mm,calc(100% - 24px));margin:18px auto;',
    'padding:14px;border:0;border-radius:8px;background:#0f172a;color:#fff;',
    'font:700 16px Arial,Helvetica,sans-serif;cursor:pointer;}',
    '@media print{',
      'html,body{width:80mm !important;max-width:80mm !important;',
      'margin:0 !important;padding:0 !important;background:#fff !important;',
      'font-size:16px;line-height:1.5;}',
      'body{padding:0 !important;}',
      '.receipt{width:80mm !important;max-width:80mm !important;border:0 !important;',
      'border-radius:0 !important;box-shadow:none !important;',
      'padding:5mm 4mm 6mm !important;margin:0 !important;}',
      '.brand{font-size:24px;margin-bottom:10px;}',
      '.row{font-size:16px;margin:5px 0;}',
      'th{font-size:16px;padding:5px 3px;}',
      'td{font-size:18px;padding:6px 3px;}',
      'table,.total-row{page-break-inside:avoid;break-inside:avoid;}',
      '.print-action{display:none !important;}',
    '}',
  ].join('');

  return (
    `<!doctype html><html lang="${langAttr}"><head><meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
    `<title>Receipt ${escapeHtml(b?.orderCode || b?._id || '')}</title>` +
    `<style>${css}</style></head><body>` +
    `<main class="receipt">` +
    `<h1 class="brand">Chapati Delivery</h1>` +
    `<div class="row big"><span class="label">Name</span><span class="value">${escapeHtml(b?.customer?.name || '-')}</span></div>` +
    `<div class="row big"><span class="label">Code</span><span class="value">${escapeHtml(b?.orderCode || b?._id || '-')}</span></div>` +
    `<div class="row big"><span class="label">Phone</span><span class="value">${escapeHtml(b?.customer?.phone || '-')}</span></div>` +
    `<div class="row big"><span class="label">Placed</span><span class="value">${escapeHtml(formatDateTime(b?.createdAt))}</span></div>` +
    noteBlock +
    `<div class="line"></div>` +
    `<table><thead><tr><th>Qty</th><th>Product</th><th class="amt">Total</th></tr></thead>` +
    `<tbody>${itemRows || '<tr><td colspan="3" style="text-align:center">No items</td></tr>'}</tbody></table>` +
    `<div class="total-row"><span>Grand Total</span><span class="amt">€${totalAmount.toFixed(2)}</span></div>` +
    `<p class="foot">Thank you — Chapati Delivery</p>` +
    `</main>` +
    `</body></html>`
  );
};

/**
 * Print a receipt silently from the current page — no new tab, no popup.
 * The receipt HTML is rendered inside a hidden iframe so only the receipt is
 * passed to the OS print dialog (the admin UI stays out of the paper).
 */
export const printReceiptSilently = (html, { onError } = {}) => {
  if (typeof window === 'undefined') return;
  let iframe = document.getElementById('chapati-receipt-print-frame');
  if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);

  iframe = document.createElement('iframe');
  iframe.id = 'chapati-receipt-print-frame';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  // Off-screen, no border, no scrollbars — user never sees it.
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  const triggerPrint = () => {
    if (!iframe || !iframe.contentWindow) {
      cleanup();
      if (typeof onError === 'function') onError();
      return;
    }
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      /* browser blocked the print — fall back silently */
    }
    // Remove the iframe once printing is dispatched so it doesn't linger in the DOM.
    setTimeout(cleanup, 1000);
  };

  iframe.addEventListener('load', () => {
    // Give the browser a moment to lay out the receipt before opening the dialog.
    setTimeout(triggerPrint, 200);
  }, { once: true });

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    if (typeof onError === 'function') onError();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
};
