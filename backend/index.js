require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const exclusionRoutes = require('./routes/exclusionRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/exclusions', exclusionRoutes);

// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Basic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});
