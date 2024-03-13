const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Param middleware that runs for a specific route param
// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect, // must run before retrictTo because of user info
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

router.get('/reviews', reviewController.getAllReviews);
router
  .route('/reviews/:id')
  .post(authController.protect, reviewController.createReview);

module.exports = router;
