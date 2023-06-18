const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');

exports.setCycleUserIds = (req, res, next) => {
  if (!req.body.cycle) req.body.cycle = req.params.cycleId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.getBooking = factory.getOne(Booking);
