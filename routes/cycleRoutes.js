const express = require('express');

const cycleController = require(`../controllers/cycleController`);
const authController = require(`../controllers/authController`);
const bookingRouter = require('./bookingRoutes');

const router = express.Router();

router.use('/:cycleId/bookings', bookingRouter); // TODO

router.use(authController.protect);

router
  .route('/cycles-within/:distance/center/:latlng/')
  .get(cycleController.getCyclesWithin);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(cycleController.getAllCycles)
  .post(cycleController.createCycle);

router
  .route('/:id')
  .get(cycleController.getCycle)
  .patch(cycleController.updateCycle)
  .delete(cycleController.deleteCycle);

module.exports = router;
