/* eslint-disable no-console */
/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const Cycle = require('./cycleModel');
const User = require('./userModel');

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

const bookingStream = Booking.watch([], {
  fullDocument: 'updateLookup',
  fullDocumentBeforeChange: 'required',
});

bookingStream.on('change', async (change) => {
  if (change.operationType === 'delete') {
    const doc = change.fullDocumentBeforeChange;
    await Cycle.findByIdAndUpdate(doc.cycle, { available: true });
    let cost = Math.round((Date.now() - new Date(doc.createdAt)) / 1000 / 60);
    const user = await User.findById(doc.user);
    if (cost > user.balance) cost = user.balance;
    user.balance -= cost;
    await user.save({ validateBeforeSave: false }); // also need to add trip info to user db
  } else if (change.operationType === 'insert') {
    const doc = change.fullDocument;
    await Cycle.findByIdAndUpdate(doc.cycle, { available: false });
  }
});

module.exports = Booking;
