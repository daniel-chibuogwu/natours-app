const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const bookingRouter = require('./bookingRoutes');

const router = express.Router();

// Param middleware that runs for a specific route param
// router.param('id', tourController.checkID);

// Nested Routes -  We use mergeParams on the review router to make this 'redirecting' work
router.use('/:tourId/reviews', reviewRouter);
router.use('/:tourId/bookings', bookingRouter);

// Aggregations
router.get(
  '/top-5-cheap',
  tourController.aliasTopTours,
  tourController.getAllTours,
);

router.get('/tour-stats', tourController.getTourStats);
router.get(
  '/monthly-plan/:year',
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlan,
);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect, // must run before retrictTo because of user info that is added in req and needed in the restrictTo middleware
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
