const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(reviewController.getAllReviews).post(
  authController.protect, // must run first before we need user info for the restrictTo middleware
  authController.restrictTo('user'), // to prevent admins and guides from creating reviews
  reviewController.createReview,
);

module.exports = router;

// Nested Routes examples
// POST - /tour/837337/reviews
// GET - /tour/837337/reviews
// GET - /tour/837337/reviews/93993837 - Get a particular review on a tour
