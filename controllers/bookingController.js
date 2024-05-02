const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Email = require('../utils/email');
const User = require('../models/userModel');

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
    // success_url: `${rootURL(req)}/my-tours?tour=${req.params.tourID}&user=${
    //   req.user.id
    // }&price=${tour.price}`,
    success_url: `${rootURL(req)}/my-tours?alert=booking`,
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
            images: [`${rootURL(req)}/img/tours/${tour.imageCover}`],
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

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //This is only TEMPORARY, because it's not secure as every with the stripe success URL can create a Booking without payment
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   // Create  Booking
//   const newBooking = await Booking.create({ tour, user, price });

//   // Find the newly created booking and populate the referenced fields so we can use it for the mail
//   const populatedBooking = await Booking.findById(newBooking._id)
//     .populate('user')
//     .populate('tour');

//   //Send Confirmation Email
//   await new Email(
//     populatedBooking.user,
//     `${rootURL(req)}/${populatedBooking.tour.slug}`,
//   ).sendBookingConfirmed(populatedBooking.tour.name);

//   // Redirect to remove the query parameters, to make secure and not show on the client's browser
//   res.redirect(`${req.originalUrl.split('?')[0]}`);
// });
const createBookingCheckout = catchAsync(async (session, req) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;

  const newBooking = await Booking.create({ tour, user, price });

  //   // Find the newly created booking and populate the referenced fields so we can use it for the mail
  const populatedBooking = await Booking.findById(newBooking._id)
    .populate('user')
    .populate('tour');

  //Send Confirmation Email
  await new Email(
    populatedBooking.user,
    `${rootURL(req)}/${populatedBooking.tour.slug}`,
  ).sendBookingConfirmed(populatedBooking.tour.name);
});

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object, req);
  }

  res.status(200).json({ received: true, codedBy: 'Daniel Chillings' });
};

exports.getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings,
    },
  });
});
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
