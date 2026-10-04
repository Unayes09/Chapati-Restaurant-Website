const express = require('express');
const router = express.Router();
const auth = require('../middelwares/auth');
const {
  getClosedDaysPublic,
  checkDate,
  listClosedDays,
  createClosedDay,
  deleteClosedDay,
} = require('../controllers/closedDayController');

// Public
router.get('/', getClosedDaysPublic);
router.get('/check', checkDate);

// Admin
router.get('/all', auth, listClosedDays);
router.post('/', auth, createClosedDay);
router.delete('/:id', auth, deleteClosedDay);

module.exports = router;
