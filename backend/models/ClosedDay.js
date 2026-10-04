const mongoose = require('mongoose');

// Each record is an inclusive date range [startDate, endDate] on which the
// restaurant is closed. Multiple non-overlapping records can exist; overlaps are
// de-duplicated by the API when listing.
const closedDaySchema = new mongoose.Schema(
  {
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true }, // YYYY-MM-DD (inclusive)
    reason: { type: String, default: '' },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

closedDaySchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('ClosedDay', closedDaySchema);
