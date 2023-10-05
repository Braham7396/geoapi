const User = require('../models/userModel');
const PastBooking = require('../models/pastBookingsModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm || req.body.email)
    return next(
      new AppError(
        'This route is not for password update! Please use /updateMyPassword.',
        400
      )
    );
  if (req.body.email)
    return next(new AppError('Email updation not supported', 400));

  const filteredBody = filterObj(req.body, 'name');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  updatedUser._id = null; //* user should not get their id
  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const activeBooking = await Booking.findOne({ user: req.user.id });
  if (activeBooking)
    return next(
      new AppError(
        'You cannot delete your account while you have an active trip. Please end your trip, then proceed',
        400
      )
    );
  await User.findByIdAndDelete(req.user.id);
  await PastBooking.findOneAndDelete({ userId: req.user.id });
  //? what if - user makes a booking and then deletes account?
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// TODO - Add pagination
exports.getMyPastBookings = catchAsync(async (req, res, next) => {
  const pastBookings = await PastBooking.findOne({ userId: req.user.id });
  // eslint-disable-next-line prefer-destructuring
  const page = req.params.page;
  res.status(200).json({
    status: 'success',
    data: pastBookings,
    page: page,
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id); // no cycle populate here
  user._id = null;
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

//! -- ADMIN ZONE --

exports.getUser = factory.getOne(User, { path: 'cycle' }); // add populate cycle here
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
