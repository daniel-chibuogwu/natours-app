const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/me', authController.protect, viewsController.getAccount);
router.get(
  '/my-tours',
  authController.protect,
  bookingController.createBookingCheckout,
  viewsController.getMyTours,
);
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData,
);

router.use(authController.isLoggedIn); /////////////////// From here this middleware runs for all the below routes
router.get('/', viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);

module.exports = router;
