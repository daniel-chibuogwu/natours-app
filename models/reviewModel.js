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
  // IN a static method, 'this' keyword points to the MODEL and that's why we are using a static method to have access to the Model so we can use aggregates
  const stats = await this.aggregate([
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

  // Updating the tour with the stats
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};

//using 'post' so that the current can be saved first before calculations
// We have to use constructor because we don't have the Review model defined before this and we can't put it after
//it because of the Review Schema which is use to create the model must also have this middleware before it's used to create the model
// 'this' is the document and constructor is the model that created the document
// NOTE: The post middleware does not get access to next
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
