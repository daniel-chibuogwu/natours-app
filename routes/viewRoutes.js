const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/me', authController.protect, viewsController.getAccount);
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData,
);

router.use(authController.isLoggedIn); /////////////////// From here this middleware runs for all the below routes
router.get(
  '/',
  bookingController.createBookingCheckout,
  viewsController.getOverview,
);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);

module.exports = router;
