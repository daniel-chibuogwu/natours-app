const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour name must be provided'],
      unique: true,
      trim: true,
      maxLength: [
        40,
        'A tour name must have less than or equal to 40 Characters',
      ],
      minLength: [10, 'A tour name must have more than 10 Characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain alphabets'],
    },
    slug: String,
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
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour price must be provided'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // the "this" keyword points to the current document when creating a new one and wouldn't work when updating
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
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
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: Runs before the .save() and .create() and not on .insertMany() or update


//We call this a Pre save hook or middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will Save document');
//   next();
// });

// Runs after all pre middlewares have finished running and we no longer have the "this" keyword
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
// Here the this keyword would point at the current query and not the current document
// we are using a regex here so that this would be triggered for all events that starts with find
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

//AGGREGATION MIDDLEWARE
// "this" points to the current aggregation object
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
