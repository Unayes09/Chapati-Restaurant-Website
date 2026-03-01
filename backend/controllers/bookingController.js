const Booking = require('../models/Booking');
const sendEmail = require('../utils/email');

// Customer: Create a new booking/order
const createBooking = async (req, res) => {
  try {
    const { customer, table, bookingDate, bookingTime, additionalInfo, items, totalAmount } = req.body;
    
    const booking = new Booking({
      customer,
      table,
      bookingDate,
      bookingTime,
      additionalInfo,
      items,
      totalAmount,
    });

    await booking.save();

    // Send confirmation email to customer
    const emailSubject = 'Your Chapati 35 Booking Request';
    const emailText = `Hello ${customer.name}, your booking for ${bookingDate} at ${bookingTime} has been received. We will confirm it soon.`;
    const emailHtml = `
      <h3>Hello ${customer.name},</h3>
      <p>Your booking for <strong>${bookingDate}</strong> at <strong>${bookingTime}</strong> has been received.</p>
      <p>Order Summary:</p>
      <ul>
        ${items.map(item => `<li>${item.qty}x ${item.label} ${item.price ? `(€${item.price.toFixed(2)})` : ''}</li>`).join('')}
      </ul>
      <p>Total Amount: €${totalAmount.toFixed(2)}</p>
      <p>We will notify you once your booking is confirmed or rejected.</p>
    `;

    await sendEmail(customer.email, emailSubject, emailText, emailHtml);

    res.status(201).send(booking);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Admin: Get all bookings with filtering/search
const getBookings = async (req, res) => {
  try {
    const { date, time, tableSize, search } = req.query;
    let query = {};

    if (date) query.bookingDate = date;
    if (time) query.bookingTime = time;
    if (tableSize) query['table.size'] = tableSize;
    
    // Global search for customer name/email/phone
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.send(bookings);
  } catch (error) {
    res.status(500).send({ error: error.message });
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

    await sendEmail(booking.customer.email, emailSubject, emailText, emailHtml);

    res.send(booking);
  } catch (error) {
    res.status(400).send(error);
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
    const emailSubject = 'Chapati 35: Booking Status';
    const emailText = `Hello ${booking.customer.name}, we are sorry to inform you that we cannot fulfill your booking for ${booking.bookingDate} at ${booking.bookingTime} at this time.`;
    const emailHtml = `
      <h3>Hello ${booking.customer.name},</h3>
      <p>We are sorry to inform you that we cannot fulfill your booking for <strong>${booking.bookingDate}</strong> at <strong>${booking.bookingTime}</strong> at this time.</p>
      <p>Please feel free to book for another time or contact us directly.</p>
    `;

    await sendEmail(booking.customer.email, emailSubject, emailText, emailHtml);

    res.send(booking);
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports = { createBooking, getBookings, confirmBooking, rejectBooking };
