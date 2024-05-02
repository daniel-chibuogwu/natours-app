const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.setTourUserIds = (req, res, next) => {
  // Allow Nested Routes and the user and manually specify the tour and user ids in the request body
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.validateReview = catchAsync(async (req, res, next) => {
  //  1) Find booking with user ID and tour ID
  const booking = await Booking.findOne({
    user: req.body.user,
    tour: req.body.tour,
  });

  //  2) If booking exists create booking else return 403 error
  if (!booking)
    return next(
      new AppError(
        'Users can only review a tour that they have actually booked!',
        403,
      ),
    );

  next();
});
exports.createReview = factory.createOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
