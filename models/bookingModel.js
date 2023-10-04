/* eslint-disable no-console */
/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const Cycle = require('./cycleModel');
const User = require('./userModel');
const PastBooking = require('./pastBookingsModel');

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
      //? chatGPT - does not appear for createBooking, getBooking (how to - select : false)
      //? but still we could search for bookings made by a specific user
      //? also user should appear on bookingStream
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

/**
 * ? TTL index was manually added to monogoDB Atlas because index was not showing on atlas by code
 * * To change trip expiry time, change it from atlas
 */

// bookingSchema.index(
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
    //* getting access to the recently deleted booking document
    const doc = change.fullDocumentBeforeChange;
    // cycle becomes available
    // await Cycle.findByIdAndUpdate(doc.cycle, { available: true });
    await Cycle.updateOne({ _id: doc.cycle }, { available: true });
    // timings of the trip
    const endTime = Date.now();
    const startTime = new Date(doc.createdAt);

    //* cost measurement => 10 INR if time <= 10 mins, else cost = 10 + (time - 10 mins) * 0.5 INR
    const durationInSeconds = Math.round((endTime - startTime) / 1000);
    let cost = 10;
    if (durationInSeconds > 10 * 60)
      cost += ((durationInSeconds - 10 * 60) / 60) * 0.5;

    //* updating the user balance now
    const user = await User.findById(doc.user);
    if (cost > user.balance) cost = user.balance;
    user.balance -= cost;
    await user.save({ validateBeforeSave: false });

    //* when delete -- save trip in pastBookings of the user (Adding trip info to db)
    //* all users must have an empty pastTrips doc in the beginning (Done when signup otp verify)
    await PastBooking.updateOne(
      { userId: doc.user },
      {
        $push: {
          trips: {
            $each: [
              {
                cycleId: doc.cycle,
                startTime,
                endTime,
                cost,
              },
            ],
            $sort: { startTime: -1 },
          },
        },
      }
    );
  } else if (change.operationType === 'insert') {
    const doc = change.fullDocument;
    //* cycle becomes unavailable
    await Cycle.updateOne({ _id: doc.cycle }, { available: false });
  }
});

module.exports = Booking;
