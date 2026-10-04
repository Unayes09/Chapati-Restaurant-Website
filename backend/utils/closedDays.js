const ClosedDay = require('../models/ClosedDay');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isIsoDate = (value) => typeof value === 'string' && DATE_RE.test(value);

const toParisDateString = (input) => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  // Use Europe/Paris calendar fields so "today" matches the restaurant's wall clock.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return y && m && day ? `${y}-${m}-${day}` : null;
};

const todayParis = () => toParisDateString(new Date());

/**
 * Check whether a given ISO date (YYYY-MM-DD) falls inside any stored closed range.
 */
const isDateClosed = async (isoDate) => {
  if (!isIsoDate(isoDate)) return false;
  const hit = await ClosedDay.exists({
    startDate: { $lte: isoDate },
    endDate: { $gte: isoDate },
  });
  return Boolean(hit);
};

/**
 * Find an open closed range that covers today, used to render the public banner.
 * Returns the raw record or null.
 */
const findActiveClosureForToday = async () => {
  const today = todayParis();
  if (!today) return null;
  return ClosedDay.findOne({
    startDate: { $lte: today },
    endDate: { $gte: today },
  }).lean();
};

/**
 * Return every record that intersects a given date (used by date pickers to disable days).
 * Accepts a single ISO date or no argument (= today).
 */
const findClosuresAffectingDate = async (isoDate) => {
  const target = isIsoDate(isoDate) ? isoDate : todayParis();
  if (!target) return [];
  return ClosedDay.find({ startDate: { $lte: target }, endDate: { $gte: target } }).lean();
};

/**
 * Return a list of plain ISO dates (YYYY-MM-DD) inside all current/future ranges
 * up to a horizon. Useful for the customer-facing calendar to grey out days.
 */
const listAllClosedDates = async (horizonDays = 365) => {
  const today = todayParis();
  if (!today) return [];
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + horizonDays);
  const horizonIso = toParisDateString(horizon);
  if (!horizonIso) return [];

  const ranges = await ClosedDay.find({
    endDate: { $gte: today },
    startDate: { $lte: horizonIso },
  }).lean();

  const out = new Set();
  for (const range of ranges) {
    let cursor = new Date(`${range.startDate}T00:00:00Z`);
    const end = new Date(`${range.endDate}T00:00:00Z`);
    while (cursor <= end) {
      const iso = toParisDateString(cursor);
      if (iso) out.add(iso);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return Array.from(out).sort();
};

const validateRange = ({ startDate, endDate }) => {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return 'Start and end dates must be in YYYY-MM-DD format.';
  }
  if (startDate > endDate) {
    return 'End date must be on or after start date.';
  }
  return null;
};

module.exports = {
  isIsoDate,
  toParisDateString,
  todayParis,
  isDateClosed,
  findActiveClosureForToday,
  findClosuresAffectingDate,
  listAllClosedDates,
  validateRange,
};
