const Booking = require('../models/Booking');
const sendEmail = require('../utils/email');

const formatParisTime = (date) =>
  new Date(date).toLocaleTimeString('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const formatParisDate = (date) =>
  new Date(date).toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

// Customer: Create a new booking (legacy) OR pickup order (new)
const createBooking = async (req, res) => {
  try {
    const {
      customer,
      table,
      bookingDate,
      bookingTime,
      additionalInfo,
      items,
      totalAmount,
      pickupRequestedInMinutes,
    } = req.body;

    const isPickupOrder = Number.isFinite(Number(pickupRequestedInMinutes));

    const booking = new Booking(
      isPickupOrder
        ? {
            orderType: 'pickup',
            customer,
            additionalInfo,
            items: Array.isArray(items) ? items : [],
            totalAmount: Number(totalAmount || 0),
            pickupRequestedInMinutes: Number(pickupRequestedInMinutes),
          }
        : {
            orderType: 'booking',
            customer,
            table,
            bookingDate,
            bookingTime,
            additionalInfo,
            items: [],
            totalAmount: 0,
            status: 'confirmed',
          },
    );

    await booking.save();

    const io = req.app.get('io');
    if (io && booking.orderType === 'pickup') {
      io.emit('new_order', {
        id: booking._id,
        orderCode: booking.orderCode,
        createdAt: booking.createdAt,
      });
    }

    const safeItems = Array.isArray(items) ? items : [];

    const emailSubject = isPickupOrder
      ? 'Chapati 35: Order Request Received'
      : 'Your Chapati 35 Booking Request';

    const emailText = isPickupOrder
      ? `Hello ${customer.name}, your order request has been received. Requested pickup: ${pickupRequestedInMinutes} minutes. We will confirm soon.`
      : `Hello ${customer.name}, your reservation is confirmed for ${bookingDate} at ${bookingTime}.`;

    const emailHtml = isPickupOrder
      ? `
        <h3>Hello ${customer.name},</h3>
        <p>Your order request has been received.</p>
        <p><strong>Requested pickup:</strong> ${pickupRequestedInMinutes} minutes</p>
        <p>Order Summary:</p>
        <ul>
          ${safeItems
            .map(
              (item) =>
                `<li>${item.qty}x ${item.label} ${
                  item.price ? `(€${Number(item.price).toFixed(2)})` : ''
                }</li>`,
            )
            .join('')}
        </ul>
        <p>Total Amount: €${Number(totalAmount || 0).toFixed(2)}</p>
        <p>We will email you once your order is received and your pickup time is confirmed.</p>
      `
      : `
        <h3>Hello ${customer.name},</h3>
        <p>Your reservation is <strong>CONFIRMED</strong>.</p>
        <p><strong>Date:</strong> ${bookingDate}</p>
        <p><strong>Time:</strong> ${bookingTime}</p>
        <p><strong>Table size:</strong> ${table?.size || '-'}</p>
        <p>See you soon!</p>
      `;

    sendEmail(customer.email, emailSubject, emailText, emailHtml)
      .then((mailResult) => {
        if (!mailResult.ok) console.error('[booking] createBooking email failed:', mailResult.error);
      })
      .catch((err) => console.error('[booking] createBooking email error:', err));

    res.status(201).send(booking);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Admin: Get all bookings with filtering/search
const getBookings = async (req, res) => {
  try {
    const { date, dateFrom, dateTo, time, tableSize, search, status, code, orderType, createdDate, page, limit } = req.query;
    let query = {};

    if (date) {
      query.bookingDate = date;
    } else if (dateFrom || dateTo) {
      query.bookingDate = {};
      if (dateFrom) query.bookingDate.$gte = dateFrom;
      if (dateTo) query.bookingDate.$lte = dateTo;
    }
    if (time) query.bookingTime = time;
    if (tableSize) query['table.size'] = tableSize;
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (code) query.orderCode = code;

    if (createdDate) {
      const start = new Date(`${createdDate}T00:00:00.000Z`);
      const end = new Date(`${createdDate}T23:59:59.999Z`);
      query.createdAt = { $gte: start, $lte: end };
    }
    
    // Global search for customer name/email/phone
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { orderCode: { $regex: search, $options: 'i' } },
      ];
    }

    const safeLimit = Math.min(Math.max(parseInt(limit || '10', 10) || 10, 1), 50);
    const safePage = Math.max(parseInt(page || '1', 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, data] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    ]);

    res.send({
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Admin: Mark pickup order as received (confirm pickup time)
const receiveOrder = async (req, res) => {
  try {
    const { confirmedMinutes } = req.body;
    const minutes = Number(confirmedMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return res.status(400).send({ error: 'confirmedMinutes must be a positive number' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send({ error: 'Order not found' });

    booking.status = 'received';
    booking.pickupConfirmedInMinutes = minutes;
    booking.pickupConfirmedAt = new Date();
    booking.pickupReadyAt = new Date(Date.now() + minutes * 60 * 1000);
    await booking.save();

    const readyDateParis = formatParisDate(booking.pickupReadyAt);
    const readyTimeParis = formatParisTime(booking.pickupReadyAt);

    const emailSubject = `Chapati 35: Order Received (${booking.orderCode})`;
    const emailText = `Hello ${booking.customer.name}, your order is received. Your pickup code is ${booking.orderCode}. You can collect after ${readyTimeParis} (Paris time).`;
    const emailHtml = `
      <h3>Hello ${booking.customer.name},</h3>
      <p>Your order has been <strong>RECEIVED</strong>.</p>
      <p><strong>Pickup code:</strong> ${booking.orderCode}</p>
      <p><strong>Ready after:</strong> ${readyDateParis} ${readyTimeParis} (Paris time)</p>
      <p>Please show your pickup code at the counter.</p>
    `;

    sendEmail(booking.customer.email, emailSubject, emailText, emailHtml)
      .then((mailReceive) => {
        if (!mailReceive.ok) console.error('[booking] receiveOrder email failed:', mailReceive.error);
      })
      .catch((err) => console.error('[booking] receiveOrder email error:', err));

    res.send(booking);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Admin: Mark pickup order as collected by customer
const markCollected = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send({ error: 'Order not found' });

    booking.status = 'collected';
    await booking.save();

    res.send(booking);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Admin: Confirm a booking
const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).send({ error: 'Booking not found' });
    }

    booking.status = 'confirmed';
    await booking.save();

    // Send confirmation email
    const emailSubject = 'Chapati 35: Booking Confirmed!';
    const emailText = `Great news ${booking.customer.name}! Your booking for ${booking.bookingDate} at ${booking.bookingTime} is confirmed. See you soon!`;
    const emailHtml = `
      <h3>Great news ${booking.customer.name}!</h3>
      <p>Your booking for <strong>${booking.bookingDate}</strong> at <strong>${booking.bookingTime}</strong> has been <strong>CONFIRMED</strong>.</p>
      <p>We look forward to serving you!</p>
    `;

    sendEmail(booking.customer.email, emailSubject, emailText, emailHtml)
      .then((mailConfirm) => {
        if (!mailConfirm.ok) console.error('[booking] confirmBooking email failed:', mailConfirm.error);
      })
      .catch((err) => console.error('[booking] confirmBooking email error:', err));

    res.send(booking);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Admin: Reject a booking
const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).send({ error: 'Booking not found' });
    }

    booking.status = 'rejected';
    await booking.save();

    // Send rejection email
    const isPickupOrder = booking.orderType === 'pickup';
    const emailSubject = isPickupOrder ? 'Chapati 35: Order Status' : 'Chapati 35: Booking Status';
    const emailText = isPickupOrder
      ? `Hello ${booking.customer.name}, we are sorry to inform you that we cannot fulfill your order at this time.`
      : `Hello ${booking.customer.name}, we are sorry to inform you that we cannot fulfill your booking for ${booking.bookingDate} at ${booking.bookingTime} at this time.`;
    const emailHtml = isPickupOrder
      ? `
        <h3>Hello ${booking.customer.name},</h3>
        <p>We are sorry to inform you that we cannot fulfill your order at this time.</p>
        <p>Please feel free to place a new order later or contact us directly.</p>
      `
      : `
        <h3>Hello ${booking.customer.name},</h3>
        <p>We are sorry to inform you that we cannot fulfill your booking for <strong>${booking.bookingDate}</strong> at <strong>${booking.bookingTime}</strong> at this time.</p>
        <p>Please feel free to book for another time or contact us directly.</p>
      `;

    sendEmail(booking.customer.email, emailSubject, emailText, emailHtml)
      .then((mailReject) => {
        if (!mailReject.ok) console.error('[booking] rejectBooking email failed:', mailReject.error);
      })
      .catch((err) => console.error('[booking] rejectBooking email error:', err));

    res.send(booking);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

module.exports = { createBooking, getBookings, receiveOrder, markCollected, confirmBooking, rejectBooking };
