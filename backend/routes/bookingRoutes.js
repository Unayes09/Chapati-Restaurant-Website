const express = require('express');
const router = express.Router();
const { createBooking, getBookings, confirmBooking, rejectBooking } = require('../controllers/bookingController');
const auth = require('../middelwares/auth');

// Public route for customers
router.post('/', createBooking);

// Protected routes for admin
router.get('/', auth, getBookings);
router.patch('/:id/confirm', auth, confirmBooking);
router.patch('/:id/reject', auth, rejectBooking);

module.exports = router;
