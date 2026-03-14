const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  orderType: {
    type: String,
    enum: ['booking', 'pickup'],
    default: 'pickup',
    index: true,
  },
  orderCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  table: {
    size: {
      type: String,
      required: function requiredTableSize() {
        return this.orderType === 'booking';
      },
    }, // e.g., '2', '4', '6', '8'
  },
  bookingDate: {
    type: String,
    required: function requiredBookingDate() {
      return this.orderType === 'booking';
    },
  }, // YYYY-MM-DD
  bookingTime: {
    type: String,
    required: function requiredBookingTime() {
      return this.orderType === 'booking';
    },
  }, // HH:MM
  pickupRequestedInMinutes: {
    type: Number,
    required: function requiredPickupRequested() {
      return this.orderType === 'pickup';
    },
  },
  pickupConfirmedInMinutes: { type: Number },
  pickupConfirmedAt: { type: Date },
  pickupReadyAt: { type: Date },
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
    enum: ['pending', 'confirmed', 'received', 'collected', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

const toOrderCodePrefix = (value) => {
  const cleaned = String(value || '').replace(/[^a-zA-Z0-9]/g, '');
  const prefix = cleaned.slice(0, 2).toUpperCase();
  return prefix.length === 2 ? prefix : 'OD';
};

const random4Digits = () => Math.floor(1000 + Math.random() * 9000);

bookingSchema.pre('save', async function preSave() {
  if (this.orderCode) return;
  if (!this.items || this.items.length === 0) return;

  const prefix = toOrderCodePrefix(this.items[0]?.label);
  for (let i = 0; i < 8; i++) {
    const candidate = `${prefix}-${random4Digits()}`;
    const exists = await this.constructor.exists({ orderCode: candidate });
    if (!exists) {
      this.orderCode = candidate;
      return;
    }
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
