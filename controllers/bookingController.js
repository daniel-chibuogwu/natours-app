const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const rootURL = req => `${req.protocol}://${req.get('host')}`;

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);
  if (!tour) return next(new AppError("Can't find tour for booking!", 404));

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // Information about the session
    payment_method_types: ['card'],
    // Not secure yet has anyone can create a booking now without paying if they know the URL
    success_url: `${rootURL(req)}?tour=${req.params.tourID}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${rootURL(req)}/tour/${tour.slug}`,
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
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          currency: 'usd',
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response and redirect
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //This is only TEMPORARY, because it's not secure as every with the stripe success URL can create a Booking without payment
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  // Create  Booking
  await Booking.create({ tour, user, price });

  // Redirect to remove the query parameters
  res.redirect(`${rootURL(req)}${req.originalUrl.split('?')[0]}`);
});

exports.getAllBookings = factory.getAll(Booking);