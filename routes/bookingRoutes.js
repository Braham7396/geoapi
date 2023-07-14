const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), bookingController.getAllBookings)
  .post(
    bookingController.setCycleUserIds,
    bookingController.checkBookingPrerequisites,
    bookingController.createBooking
  );

router
  .route('/:id')
  .get(
    authController.checkBookingAccessPrequisites, // if admin OR valid user
    bookingController.getBooking
  )
  .delete(
    authController.checkBookingAccessPrequisites, // if admin OR valid user
    bookingController.deleteBooking
  ); // to end ride

module.exports = router;
