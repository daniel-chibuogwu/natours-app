const mongoose = require('mongoose');

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
reviewSchema.pre(/^find/, function () {
  this.populate({
    path: 'tour',
    select: '-__v',
  }).populate({
    path: 'user',
    select: '-__v',
  });
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
