/* eslint-disable no-unused-vars */
const PastBooking = require('../models/pastBookingsModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * TODO - add get past bookings with the following functionality:
 * ? making sure bookings have pagination (may use APIFeatures)
 * ? making sure the trips are in descending order (may use APIFeatures)
 * ? Also have proper authorization to see past trips
 * */
