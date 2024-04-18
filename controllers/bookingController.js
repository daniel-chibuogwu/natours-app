const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);
  if (!tour) return new next(new AppError("Can't find tour for booking!", 404));

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // Information about the session
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email, // remember that this is a protected router and the user is always on the req object because of this,
    client_reference_id: req.params.tourID,
    mode: 'payment',
    // Information about the product
    line_items: [
      {
        price_data: {
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `https://www.natours.dev/img/tours/${tour.imageCover}.jpg`,
            ],
          },
          currency: 'usd',
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});
