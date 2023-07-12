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
    bookingController.checkBookingValidity,
    bookingController.createBooking
  );

router
  .route('/:id')
  .get(bookingController.getBooking) // need to have proper authorization for this
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
