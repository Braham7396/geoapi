/* eslint-disable no-console */
/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');

const pastBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must be done by a user'],
      unique: true,
    },
    trips: [
      {
        cycleId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Cycle',
          required: [true, 'A trip must have a cycle associated to it'],
        },
        startTime: Date,
        endTime: Date,
        cost: Number,
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

pastBookingSchema.pre('save', function (next) {
  this.trips.sort((a, b) => b.startTime - a.startTime);
  next();
});

const PastBooking = mongoose.model('PastBooking', pastBookingSchema);
module.exports = PastBooking;
