const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    cycle: {
      type: mongoose.Schema.ObjectId,
      ref: 'Cycle',
      required: [true, 'Booking must be done on a cycle'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must be done by a user'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ cycle: 1 }, { unique: true });
bookingSchema.index({ user: 1 }, { unique: true });

// TTL index was manually added to monogoDB Atlas because index was not showing on atlas by code
// To change trip expiry time, change it from atlas
// bookingSchema.index(
//   // fixMe - index not showing in booking model on Atlas
//   { createdAt: 1 },
//   { expireAfterSeconds: process.env.TRIP_EXPIRATION_TIME }
// );

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
