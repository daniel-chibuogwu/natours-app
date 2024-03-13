const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  console.log('I entered 1');
  const reviews = await Review.find();
  console.log('I entered 2');

  if (!reviews) return next(new AppError('No review available'));
  // SEND RESPONSE
  console.log('I entered 3');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const { review, rating, createdAt } = req.body;
  const newReview = await Review.create({
    review,
    rating,
    createdAt,
    tour: req.params.id,
    user: req.user._id,
  });
  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
