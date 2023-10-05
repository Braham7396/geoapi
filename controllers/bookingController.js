/* eslint-disable no-unused-vars */
const Booking = require('../models/bookingModel');
const Cycle = require('../models/cycleModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setCycleUserIds = (req, res, next) => {
  if (!req.body.cycle) req.body.cycle = req.params.cycleId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.checkBookingPrerequisites = catchAsync(async (req, res, next) => {
  const cycle = await Cycle.findById(req.body.cycle);

  if (req.user.balance < process.env.MINIMUM_USER_BALANCE)
    return next(
      new AppError(
        `User balance is below Rs. ${process.env.MINIMUM_USER_BALANCE}`,
        400
      )
    );
  if (!cycle || cycle.available === false)
    return next(new AppError('Cycle not available', 400));
  next();
});

exports.getAllBookings = factory.getAll(Booking);
//* gets booking via booking id
exports.getBooking = factory.getOne(Booking); //! gives user id
exports.createBooking = factory.createOne(Booking); //! gives user id

exports.deleteBooking = catchAsync(async (req, res, next) => {
  const doc = await Booking.findByIdAndDelete(req.params.id, {
    rawResult: true,
  });
  // let cost = Math.round(
  //   (Date.now() - new Date(doc.value.createdAt)) / 1000 / 60
  // ); //* need to be renewed with new algorithm

  const endTime = Date.now();
  const startTime = new Date(doc.value.createdAt);

  //* cost measurement => 10 INR if time <= 10 mins, else cost = 10 + (time - 10 mins) * 0.5 INR
  const durationInMinutes = Math.round((endTime - startTime) / 1000 / 60);
  let cost = 10;
  if (durationInMinutes > 10) cost += Math.round(durationInMinutes - 10) * 0.5;

  if (req.user.balance < cost) cost = req.user.balance;
  res.status(200).json({
    status: 'success',
    cost,
  });
});

//* To show user their current booking if booked via user id
exports.getMyActiveBooking = catchAsync(async (req, res, next) => {
  const doc = await Booking.findOne({ user: req.user.id });
  if (!doc) return next(new AppError('No Active bookings!', 400));
  doc.user = null;
  res.status(200).json({
    status: 'success',
    data: doc,
  });
});
