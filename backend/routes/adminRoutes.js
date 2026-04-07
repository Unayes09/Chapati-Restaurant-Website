const express = require('express');
const router = express.Router();
const auth = require('../middelwares/auth');
const { getStats, cleanup } = require('../controllers/adminController');

router.get('/stats', auth, getStats);
router.post('/cleanup', auth, cleanup);

module.exports = router;

