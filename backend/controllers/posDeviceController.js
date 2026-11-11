const PosDevice = require('../models/PosDevice');

const normalizeFirebaseId = (body = {}) =>
  String(body.firebaseId || body.fcmId || '').trim();

const listPosDevices = async (req, res) => {
  try {
    const devices = await PosDevice.find().sort({ createdAt: -1 }).lean();
    res.send(devices);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const addPosDevice = async (req, res) => {
  try {
    const firebaseId = normalizeFirebaseId(req.body);
    if (!firebaseId) {
      return res.status(400).send({ error: 'firebaseId is required' });
    }
    if (firebaseId.length > 2048) {
      return res.status(400).send({ error: 'firebaseId is too long' });
    }

    const existing = await PosDevice.findOne({ firebaseId });
    const device = await PosDevice.findOneAndUpdate(
      { firebaseId },
      {
        $set: {
          active: true,
          ...(req.body.label ? { label: String(req.body.label).trim() } : {}),
        },
        $setOnInsert: { addedBy: req.user._id },
      },
      { new: true, upsert: true, runValidators: true },
    );

    res.status(existing ? 200 : 201).send(device);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const updatePosDevice = async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.active === 'boolean') updates.active = req.body.active;
    if (req.body.label !== undefined) updates.label = String(req.body.label).trim();
    if (Object.keys(updates).length === 0) {
      return res.status(400).send({ error: 'Provide active or label to update' });
    }

    const device = await PosDevice.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!device) return res.status(404).send({ error: 'POS device not found' });
    res.send(device);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const deletePosDevice = async (req, res) => {
  try {
    const device = await PosDevice.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).send({ error: 'POS device not found' });
    res.send({ ok: true, deletedId: device._id });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

module.exports = {
  listPosDevices,
  addPosDevice,
  updatePosDevice,
  deletePosDevice,
};
