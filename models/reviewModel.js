const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      default: 1,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// QUERY MIDDLEWARES
reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo', // only send relevant data about the user, we don't leak things like their emails and so on
  //   });
  this.populate({
    path: 'user',
    select: 'name photo', // only send relevant data about the user, we don't leak things like their emails and so on
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // IN a static method, 'this' keyword points to the MODEL not the schema or document and that's why we are using a static method to have access to the Model so we can use aggregates
  const stats = await this.aggregate([
    // Getting all review that matches with for the Tour by ID
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // Whenever there is no match it returns an empty array and no rating and average so the do this check to handle the error
  if (stats.length > 0) {
    // Updating the tour with the stats
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//using 'post' so that calculations can be made after the review has been saved
// We have to use constructor because we don't have the Review model defined before this and we can't put it after
//it because of the Review Schema which is use to create the model must also have this middleware before it's used to create the model
// 'this' is the document and constructor is the model that created the document
// NOTE: The post middleware does not get access to next
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // In a query middleware we only have access to the query but we are using the query to get the document
  // doing this to pass a value from the 'pre' to the 'post' middleware
  this.r = await this.findOne();
  next();
});

// We are using POST here to get access to the updated data
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work where because the query has already executed and we don't can't use it again to get the document
  await this.r.constructor.calcAverageRatings(this.r.tour); // r is the review passed from the pre to the post middleware. r is a document and we can use the constructor as the Model we need 😂😂😂
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
