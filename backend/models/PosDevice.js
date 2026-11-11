const mongoose = require('mongoose');

const posDeviceSchema = new mongoose.Schema(
  {
    firebaseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 2048,
      index: true,
    },
    label: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'POS printer',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('PosDevice', posDeviceSchema);
