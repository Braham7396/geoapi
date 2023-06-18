/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const slugify = require('slugify');

const cycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A cycle must have a name'],
      unique: true,
      trim: true,
    },
    slug: String,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // now this won't show for select
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: { type: [Number], default: [0, 0] },
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cycleSchema.index({ slug: 1 });
cycleSchema.index({ startLocation: '2dsphere' });

cycleSchema.virtual('user', {
  ref: 'Booking',
  foreignField: 'cycle',
  localField: '_id',
});

// Document Middleware
cycleSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Query Middleware
cycleSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

cycleSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '-__v -passwordChangedAt -_id',
  });
  next();
});

cycleSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

const Cycle = mongoose.model('Cycle', cycleSchema);
module.exports = Cycle;
