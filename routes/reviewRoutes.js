const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// We used mergeParams so that we can merge and have access to the params coming from /tours/838383/reviews i.e the tourId without having to specify it here
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;

// Nested Routes examples
// POST - /tour/837337/reviews
// GET - /tour/837337/reviews
