const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  table: {
    size: { type: String, required: true }, // e.g., '2', '4', '6', '8'
  },
  bookingDate: { type: String, required: true }, // YYYY-MM-DD
  bookingTime: { type: String, required: true }, // HH:MM
  additionalInfo: { type: String },
  items: [
    {
      id: { type: String, required: true },
      label: { type: String, required: true },
      price: { type: Number }, // Not mandatory for all items
      qty: { type: Number, required: true },
    }
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
