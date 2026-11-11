const express = require('express');
const router = express.Router();
const auth = require('../middelwares/auth');
const { getStats, cleanup } = require('../controllers/adminController');
const {
  listPosDevices,
  addPosDevice,
  updatePosDevice,
  deletePosDevice,
} = require('../controllers/posDeviceController');

router.get('/stats', auth, getStats);
router.post('/cleanup', auth, cleanup);
router.get('/pos-devices', auth, listPosDevices);
router.post('/pos-devices', auth, addPosDevice);
router.patch('/pos-devices/:id', auth, updatePosDevice);
router.delete('/pos-devices/:id', auth, deletePosDevice);

module.exports = router;

