const Cycle = require('../models/cycleModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getAllCycles = factory.getAll(Cycle);
exports.getCycle = factory.getOne(Cycle);
exports.createCycle = factory.createOne(Cycle);
exports.updateCycle = factory.updateOne(Cycle);
exports.deleteCycle = factory.deleteOne(Cycle);

exports.getCyclesWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = distance / 6378.1 / 1000; // because distance is in meters
  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide a latitude and a longitude in the format lat,lng',
        400
      )
    );
  const cycles = await Cycle.aggregate([
    {
      $match: {
        $expr: {
          $or: [
            { $eq: ['$available', true] },
            { $eq: [req.user.role, 'admin'] },
          ],
        },
        location: {
          $geoWithin: {
            $centerSphere: [[parseFloat(lat), parseFloat(lng)], radius],
          },
        },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: cycles.length,
    data: {
      data: cycles,
    },
  });
});
