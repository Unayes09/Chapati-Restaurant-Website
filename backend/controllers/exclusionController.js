const Exclusion = require('../models/Exclusion');

// Admin: Add or Update exclusion for a date
const setExclusion = async (req, res) => {
  try {
    const { date, type, slots } = req.body;
    
    // Check if exclusion already exists for this date
    let exclusion = await Exclusion.findOne({ date });
    
    if (exclusion) {
      exclusion.type = type;
      exclusion.slots = slots || [];
      await exclusion.save();
    } else {
      exclusion = new Exclusion({ date, type, slots });
      await exclusion.save();
    }
    
    res.send(exclusion);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Admin/Public: Get exclusions (Public needs to filter slots on customer end)
const getExclusions = async (req, res) => {
  try {
    const exclusions = await Exclusion.find({});
    res.send(exclusions);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Admin: Remove exclusion for a date
const deleteExclusion = async (req, res) => {
  try {
    const result = await Exclusion.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).send({ error: 'Exclusion not found' });
    res.send({ message: 'Exclusion removed' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = { setExclusion, getExclusions, deleteExclusion };
