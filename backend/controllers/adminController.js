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

const parisHour = (d) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(d));
  const h = parts.find((p) => p.type === 'hour')?.value || '0';
  return Number(h);
};

const statusKeys = ['pending', 'confirmed', 'received', 'collected', 'rejected'];

const emptyStatusCounts = () =>
  statusKeys.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {});

const getStats = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 29);

    const bookings = await Booking.find(
      { createdAt: { $gte: start } },
      { createdAt: 1, orderType: 1, status: 1, totalAmount: 1, items: 1, table: 1 },
    ).lean();
    const messages = await Message.find({ createdAt: { $gte: start } }, { createdAt: 1, status: 1 }).lean();

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

    const pickupByStatus = emptyStatusCounts();
    const tableBookingByStatus = emptyStatusCounts();
    const hourlyOrdersParis = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    const tableSizeDistribution = new Map();
    const itemAgg = new Map();
    let revenuePickup30d = 0;
    let pickupCount30d = 0;
    let totalItemLinesPickup = 0;

    bookings.forEach((b) => {
      const st = b.status;
      if (b.orderType === 'pickup') {
        pickupCount30d += 1;
        if (st && pickupByStatus[st] !== undefined) pickupByStatus[st] += 1;
        revenuePickup30d += Number(b.totalAmount) || 0;
        const h = parisHour(b.createdAt);
        if (Number.isFinite(h) && h >= 0 && h < 24) hourlyOrdersParis[h].count += 1;
        const arr = Array.isArray(b.items) ? b.items : [];
        totalItemLinesPickup += arr.length;
        arr.forEach((it) => {
          const label = String(it?.label || 'Item').trim() || 'Item';
          const prev = itemAgg.get(label) || { label, qty: 0, orders: 0 };
          prev.qty += Number(it?.qty) || 0;
          prev.orders += 1;
          itemAgg.set(label, prev);
        });
      } else if (b.orderType === 'booking') {
        if (st && tableBookingByStatus[st] !== undefined) tableBookingByStatus[st] += 1;
        const size = b.table?.size != null ? String(b.table.size) : '—';
        tableSizeDistribution.set(size, (tableSizeDistribution.get(size) || 0) + 1);
      }
    });

    const topItems = [...itemAgg.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const tableSizeBreakdown = [...tableSizeDistribution.entries()]
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count);

    const messagesByStatus = { new: 0, read: 0 };
    messages.forEach((m) => {
      if (m.status === 'read') messagesByStatus.read += 1;
      else messagesByStatus.new += 1;
    });

    const pickupTotal = pickupCount30d || 0;
    const tableTotal = totals.reservations || 0;
    const bookingAll = pickupTotal + tableTotal;
    const pickupSharePct = bookingAll ? Math.round((pickupTotal / bookingAll) * 1000) / 10 : 0;
    const tableSharePct = bookingAll ? Math.round((tableTotal / bookingAll) * 1000) / 10 : 0;

    const insights = {
      revenuePickup30d: Math.round(revenuePickup30d * 100) / 100,
      avgPickupOrderValue:
        pickupTotal > 0 ? Math.round((revenuePickup30d / pickupTotal) * 100) / 100 : 0,
      avgItemLinesPerPickup: pickupTotal > 0 ? Math.round((totalItemLinesPickup / pickupTotal) * 10) / 10 : 0,
      pickupByStatus,
      tableBookingByStatus,
      hourlyOrdersParis,
      tableSizeBreakdown,
      topItems,
      messagesByStatus,
      mix: {
        pickupCount: pickupTotal,
        tableBookingCount: tableTotal,
        pickupSharePct,
        tableSharePct,
      },
    };

    res.send({ days, totals, insights });
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

