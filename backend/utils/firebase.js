const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

const getCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64',
    ).toString('utf8');
    return cert(JSON.parse(json));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  // Uses GOOGLE_APPLICATION_CREDENTIALS locally, or the attached service
  // account when running on Google Cloud.
  return applicationDefault();
};

const getFirebaseApp = () => {
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: getCredential(),
    ...(process.env.FIREBASE_PROJECT_ID
      ? { projectId: process.env.FIREBASE_PROJECT_ID }
      : {}),
  });
};

/**
 * Sends a high-priority, data-only FCM message to the POS phone.
 * Every FCM data value must be a string.
 */
const sendOrderToPos = async ({
  token,
  fid,
  orderId,
  customerName,
  items,
  totalAmount,
}) => {
  if (!token && !fid) {
    throw new Error('A POS Firebase installation ID or FCM token is required');
  }

  const receiptItems = (Array.isArray(items) ? items : []).map((item) => ({
    id: String(item.id || ''),
    label: String(item.printLabel || item.label || 'Item'),
    qty: Number(item.qty || 0),
    price: Number(item.price || 0),
  }));

  const message = {
    ...(fid ? { fid } : { token }),
    data: {
      orderId: String(orderId),
      customerName: String(customerName || 'Walk-in customer'),
      items: JSON.stringify(receiptItems),
      totalAmount: String(totalAmount ?? 0),
    },
    android: {
      priority: 'high',
      // Do not keep stale print jobs for longer than five minutes.
      ttl: 5 * 60 * 1000,
    },
  };

  // Intentionally no `notification` property: this is a data-only message.
  return getMessaging(getFirebaseApp()).send(message);
};

const sendOrderToPosDevices = async ({ fids, ...order }) => {
  const uniqueTargets = [...new Set((fids || []).map((id) => String(id).trim()))]
    .filter(Boolean);
  if (uniqueTargets.length === 0) {
    return { successCount: 0, failureCount: 0, failures: [] };
  }

  let successCount = 0;
  let failureCount = 0;
  const failures = [];

  // Firebase Admin accepts at most 500 messages in one sendEach call.
  for (let offset = 0; offset < uniqueTargets.length; offset += 500) {
    const batchTargets = uniqueTargets.slice(offset, offset + 500);
    const messages = batchTargets.map((target) => {
      const receiptItems = (Array.isArray(order.items) ? order.items : []).map(
        (item) => ({
          id: String(item.id || ''),
          label: String(item.printLabel || item.label || 'Item'),
          qty: Number(item.qty || 0),
          price: Number(item.price || 0),
        }),
      );

      // Older UI versions stored raw FCM registration tokens without a
      // `token:` prefix. Android FCM tokens are long and normally contain a
      // colon (for example `...:APA91...`), while FIDs are short identifiers.
      const isToken =
        target.startsWith('token:') ||
        (!target.startsWith('fid:') &&
          (target.includes(':') || target.length > 100));
      const targetValue = target.replace(/^(token|fid):/, '');

      return {
        ...(isToken ? { token: targetValue } : { fid: targetValue }),
        data: {
          orderId: String(order.orderId),
          customerName: String(order.customerName || 'Walk-in customer'),
          items: JSON.stringify(receiptItems),
          totalAmount: String(order.totalAmount ?? 0),
        },
        android: { priority: 'high', ttl: 5 * 60 * 1000 },
      };
    });

    const response = await getMessaging(getFirebaseApp()).sendEach(messages);
    successCount += response.successCount;
    failureCount += response.failureCount;
    response.responses.forEach((result, index) => {
      if (!result.success) {
        failures.push({
          firebaseId: batchTargets[index],
          code: result.error?.code,
          message: result.error?.message,
        });
      }
    });
  }

  return { successCount, failureCount, failures };
};

module.exports = { sendOrderToPos, sendOrderToPosDevices };
