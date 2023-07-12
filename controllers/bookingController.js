const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const Cycle = require('../models/cycleModel');

const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setCycleUserIds = (req, res, next) => {
  if (!req.body.cycle) req.body.cycle = req.params.cycleId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.checkBookingValidity = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const cycle = await Cycle.findById(req.body.cycle);
  if (user.balance < 15)
    return next(new AppError('User balance is below Rs. 15'));
  if (!cycle || cycle.available === false)
    return next(new AppError('Cycle not available'));
  next();
});

exports.getAllBookings = factory.getAll(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
