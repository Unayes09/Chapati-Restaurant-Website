const ClosedDay = require('../models/ClosedDay');
const {
  validateRange,
  findActiveClosureForToday,
  listAllClosedDates,
  isDateClosed,
} = require('../utils/closedDays');

// Public: returns banner state + list of upcoming closed dates for date pickers
const getClosedDaysPublic = async (req, res) => {
  try {
    const [active, upcomingDates] = await Promise.all([
      findActiveClosureForToday(),
      listAllClosedDates(365),
    ]);

    res.send({
      active: active
        ? {
            id: String(active._id),
            startDate: active.startDate,
            endDate: active.endDate,
            reason: active.reason || '',
          }
        : null,
      upcomingDates,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Public: cheap single-date check (used by reservation form before submit)
const checkDate = async (req, res) => {
  try {
    const { date } = req.query;
    const closed = await isDateClosed(date);
    res.send({ date, closed });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Admin: list all closed-day ranges
const listClosedDays = async (req, res) => {
  try {
    const items = await ClosedDay.find().sort({ startDate: 1 }).lean();
    res.send(
      items.map((item) => ({
        id: String(item._id),
        startDate: item.startDate,
        endDate: item.endDate,
        reason: item.reason || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
    );
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Admin: create a new closed-day range
const createClosedDay = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body || {};
    const error = validateRange({ startDate, endDate });
    if (error) return res.status(400).send({ error });

    const doc = new ClosedDay({
      startDate,
      endDate,
      reason: typeof reason === 'string' ? reason.trim().slice(0, 280) : '',
      createdBy: req.user?.email || '',
    });
    await doc.save();

    res.status(201).send({
      id: String(doc._id),
      startDate: doc.startDate,
      endDate: doc.endDate,
      reason: doc.reason || '',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).send({ error: 'A closed range with these dates already exists.' });
    }
    res.status(400).send({ error: err.message });
  }
};

// Admin: delete a closed-day range
const deleteClosedDay = async (req, res) => {
  try {
    const doc = await ClosedDay.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).send({ error: 'Closed-day range not found.' });
    res.send({ ok: true });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

module.exports = {
  getClosedDaysPublic,
  checkDate,
  listClosedDays,
  createClosedDay,
  deleteClosedDay,
};
