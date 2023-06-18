const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    cycle: {
      type: mongoose.Schema.ObjectId,
      ref: 'Cycle',
      required: [true, 'Booking must be done on a cycle'],
      unique: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must be done by a user'],
      unique: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: process.env.TRIP_EXPIRATION_TIME }
);

bookingSchema.index({ cycle: 1 }, { unique: true });
bookingSchema.index({ user: 1 }, { unique: true });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
