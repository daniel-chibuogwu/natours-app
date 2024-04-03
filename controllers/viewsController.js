const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Always specify the next parameter before we need it to catch the errors if any
exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get Tour data from collection
  const tours = await Tour.find();

  // 2. Build template
  // Happens in overview.pug file

  // 3. Render that template using the tour data
  // overview is the name of the template file i.e overview.pug
  res.status(200).render('overview', {
    title: 'All Tours', // The base.pug template has access to this object since it was extended and uses the title as the tab tile for the HTML
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no Tour with that name!', 404));
  }

  res.setHeader(
    'Content-Security-Policy',
    "worker-src 'self' blob: https://api.mapbox.com;",
  ); // Add blob URL to worker-src

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getAccount = (req, res) => {
  // We don't need to query the user because that would be done and passed by our 'protect' middleware
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  // This route is and must be protected and that gives user access to ther user ID

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true },
  );
  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
});
