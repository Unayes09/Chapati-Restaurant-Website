const express = require('express');
const router = express.Router();
const { setExclusion, getExclusions, deleteExclusion } = require('../controllers/exclusionController');
const auth = require('../middelwares/auth');

// Public route for customers to fetch exclusions
router.get('/', getExclusions);

// Protected routes for admin
router.post('/', auth, setExclusion);
router.delete('/:id', auth, deleteExclusion);

module.exports = router;
