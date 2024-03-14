const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');

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
  .get(authController.protect, tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect, // must run before retrictTo because of user info that is added in req and needed in the restrictTo middleware
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

// Nested Routes examples
// POST - /tour/837337/reviews
// GET - /tour/837337/reviews
// GET - /tour/837337/reviews/93993837 - Get a particular review on a tour

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   );

module.exports = router;
