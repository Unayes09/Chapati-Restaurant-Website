const Message = require('../models/Message');

const createMessage = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};
    const doc = new Message({
      name,
      email,
      phone,
      message,
    });
    await doc.save();
    res.status(201).send({ ok: true });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;
    const query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const safeLimit = Math.min(Math.max(parseInt(limit || '10', 10) || 10, 1), 50);
    const safePage = Math.max(parseInt(page || '1', 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, data] = await Promise.all([
      Message.countDocuments(query),
      Message.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    ]);

    res.send({
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const markRead = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).send({ error: 'Message not found' });
    msg.status = 'read';
    await msg.save();
    res.send(msg);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const deleted = await Message.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).send({ error: 'Message not found' });
    res.send({ ok: true });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

module.exports = { createMessage, getMessages, markRead, deleteMessage };

