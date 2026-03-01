const mongoose = require('mongoose');

const exclusionSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  type: { 
    type: String, 
    enum: ['full_day', 'partial'], 
    required: true 
  },
  slots: [{ type: String }], // Array of HH:MM if type is 'partial'
}, { timestamps: true });

// Ensure unique exclusion per date
exclusionSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('Exclusion', exclusionSchema);
