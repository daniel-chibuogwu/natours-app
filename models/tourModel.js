const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

//Schema defines the structure of documents in a MongoDB collection,
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
      set: val => Math.round(val * 10) / 10, // This runs everytime a new value is set for this field // Math.rounds gives an integer, hence the trick to get the decimal to 1.d.p
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
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], // [lon, lat]
      address: String,
      description: String,
    },
    locations: [
      // this is how we embed documents and they would have their own IDs
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true }, // This options are important for us to use virtual properties
    toObject: { virtuals: true },
  },
);

// Improving Read Performance with Indexes
// tourSchema.index({ price: 1 }); // 1 meeans ascending order and -1 means descending order
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// For Geo Spatial Data
tourSchema.index({ startLocation: '2dsphere' }); // an earth like sphere where all our data are located

// Virtual Property: Calculated from duration and would not be part of the DB but would come with the response.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual Populating our Tours with reviews (it wouldn't persist the reviews as children to our tour document in the DB )
// To use this, don't forget to turn add call .populate on the query you want to have access to this fields else it wouldn't show.
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // where the tour ID is specified in the review model
  localField: '_id', // the id in the tour model
});

// DOCUMENT MIDDLEWARE: Runs before the .save() and .create() and not on .insertMany() or update
//We call this a Pre save hook or middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// To Embed Guides
// tourSchema.pre('save', async function (next) {
//   // Payload looks like this -> "guides": ["65da4729a249bccea0150e08", "65ea620aa434fd27967f1dc5"]
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

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

tourSchema.pre(/^find/, function (next) {
  // with populate we are going to fill our query with the referenced data for guides and it's makes another query which can affect performance
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
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

//Model provides an interface for interacting with documents in that collection.
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
