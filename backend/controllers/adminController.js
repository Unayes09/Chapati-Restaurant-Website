const Booking = require('../models/Booking');
const Message = require('../models/Message');

const parisDateString = (d) => {
  const dt = new Date(d);
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(dt);
  const yyyy = parts.find((p) => p.type === 'year')?.value || '0000';
  const mm = parts.find((p) => p.type === 'month')?.value || '01';
  const dd = parts.find((p) => p.type === 'day')?.value || '01';
  return `${yyyy}-${mm}-${dd}`;
};

const getStats = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 29);

    const bookings = await Booking.find({ createdAt: { $gte: start } }, { createdAt: 1, orderType: 1 }).lean();
    const messages = await Message.find({ createdAt: { $gte: start } }, { createdAt: 1 }).lean();

    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = parisDateString(d);
      days.push({ date: key, orders: 0, reservations: 0, messages: 0 });
    }

    const byDate = new Map(days.map((d) => [d.date, d]));

    bookings.forEach((b) => {
      const key = parisDateString(b.createdAt);
      const bucket = byDate.get(key);
      if (!bucket) return;
      if (b.orderType === 'pickup') bucket.orders += 1;
      if (b.orderType === 'booking') bucket.reservations += 1;
    });

    messages.forEach((m) => {
      const key = parisDateString(m.createdAt);
      const bucket = byDate.get(key);
      if (!bucket) return;
      bucket.messages += 1;
    });

    const totals = days.reduce(
      (acc, d) => {
        acc.orders += d.orders;
        acc.reservations += d.reservations;
        acc.messages += d.messages;
        return acc;
      },
      { orders: 0, reservations: 0, messages: 0 },
    );

    res.send({ days, totals });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const cleanup = async (req, res) => {
  try {
    const { resource, keepDays } = req.body || {};
    const days = Number(keepDays);
    if (!['orders', 'reservations', 'messages'].includes(resource)) {
      return res.status(400).send({ error: 'resource must be orders, reservations, or messages' });
    }
    if (!Number.isFinite(days) || days <= 0) {
      return res.status(400).send({ error: 'keepDays must be a positive number' });
    }

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (resource === 'messages') {
      const result = await Message.deleteMany({ createdAt: { $lt: cutoff } });
      return res.send({ ok: true, deletedCount: result.deletedCount });
    }

    const orderType = resource === 'orders' ? 'pickup' : 'booking';
    const result = await Booking.deleteMany({ orderType, createdAt: { $lt: cutoff } });
    res.send({ ok: true, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

module.exports = { getStats, cleanup };

