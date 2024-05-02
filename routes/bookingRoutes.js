const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

// Merging params for nested routes to get access to tourID
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.get('/checkout-session/:tourID', bookingController.getCheckoutSession);
router.get('/me', bookingController.getMyBookings);

router.use(authController.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
