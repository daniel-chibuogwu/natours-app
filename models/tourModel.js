const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour name must be provided'],
      unique: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'A tour duration must be provided'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour group size must be provided'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour difficulty must be provided'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour price must be provided'],
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour summary must be provided'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour image cover must be provided'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // To make it absent in the response
    },
    startDates: [Date],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: Runs before the .save() and .create() and not on .insertMany()
tourSchema.pre('save', function () {
  this.slug = slugify(this.name, { lower: true });
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
