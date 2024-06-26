const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (req, res, user, statusCode = 200) => {
  const token = signToken(user._id); // using the user id as a payload for the JWT

  // Don't assume all production and deployed applications are secured HTTPS so we need to change the if statement here
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // secured using https

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, // can't be accessed or modified by the browser
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // setting to true is it's https
  });

  // Remove The Password from the output
  user.password = undefined;

  const response = {
    status: 'success',
    token,
    data: { user },
  };
  // if (statusCode === 200) {
  //   response.data = {
  //     user,
  //   };
  // }

  res.status(statusCode).json(response);
};

exports.signup = catchAsync(async (req, res, next) => {
  // For security purposes we won't use req.body directly to only allow the data specified to be store in the DB
  const { name, email, role, password, passwordConfirm, passwordChangedAt } =
    req.body;
  const newUser = await User.create({
    name,
    email,
    role,
    password,
    passwordConfirm,
    passwordChangedAt,
  });

  // Sending Welcome Email to New User
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(req, res, newUser, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  // Candidate's payload
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  // using the select() function to "add Password back" to the response because we exclude the password by default in User model
  const user = await User.findOne({ email }).select('+password');

  // The correctPassword function is a User Model method we created for all user documents (Check userModel.js)
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401));
  }
  // 3) If everything is okay, send 'token' to client
  createSendToken(req, res, user);
});

exports.logout = (req, res, next) => {
  // (Doing this because we can't just delete the cookie from local storage like we do on dev for Production because it's secured and httpOnly)
  // Just sending a fake jwt token with thesame name to replace the current one and when a user makes a request, it's unauthorised. SMART!!!🤯🤭
  // it doesn't have to be secure because we are not sending any sensitive data.
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // so it gets deleted from our browser after 10 seconds
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401), // goes to global error handler
    );
  // 2) Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // Error from here is handled Globally (the Jwt errors comes from here)

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id); // if you delete a user it find it because we set it's active to false
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist',
        401,
      ),
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE and add the current user to the req object
  req.user = currentUser; // the req travels from one middleware to another middleware so if we want to transfer data, we put it on the req object to be available somewhere else
  res.locals.user = currentUser; // so that we can access the user in our templates
  next();
});

exports.restrictTo =
  (...acceptedRoles) =>
  (req, res, next) => {
    // roles is an array using ES6 rest parameters any parameter passed becomes an array- ['admin', 'lead-guide']
    if (!acceptedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate a random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // after creating the token and updating we need to persist it to DB using save();

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  // Sending Mail and Handling error
  try {
    await new Email(user, resetURL).sendPasswordReset();

    // we can't send the reset token here unless anyone can reset anyones account so it must be in the user's email where only them have access to
    res.status(200).json({
      status: 'success',
      message: 'Token has been sent to your email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined; // setting to undefined deletes the property from the document in the DB when saved
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500, //500 error because it happens on the server
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // using a single query to also check if the time has expired
  });
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Saving the document
  await user.save(); // we use save and not update so that validation can run

  // 3) Update the changedPasswordAt property for the user using a 'pre'save middleware for old and modified documents (Check middlewares in userModel)

  // 4) Log the user in, send JWT
  createSendToken(req, res, user);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Even if we are protecting the route for only logged in users, we still need the user to confirm their password incase someone else is using their logged in device and wants to change their password
  const { passwordCurrent, newPassword, newPasswordConfirm } = req.body;

  if (!passwordCurrent || !newPassword || !newPasswordConfirm) {
    return next(
      new AppError('Please provide provide all required credientials', 400),
    );
  }

  if (passwordCurrent === newPassword) {
    return next(
      new AppError(
        'Password has already been used. Please use another password!',
        400,
      ),
    );
  }
  // 1) Get user from the collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed password is correct
  const encryptedPassword = user.password;
  if (!(await user.correctPassword(passwordCurrent, encryptedPassword))) {
    return next(new AppError('Your current password is wrong!', 401));
  }

  // 3) Update the password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save(); // we are not using findByIdandUpdate because the validation and 'pre' middlewares is not going to work don't use update for anything relating to passwords
  //////// Remember Password changedAt updates thanks to middleware in user model

  // 4) Log user in, send JWT
  createSendToken(req, res, user);
});

// Only for rendered pages and shouldn’t send errors! (It's a Checker)
exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting token and check if it's there
  if (req.cookies.jwt) {
    try {
      // 2) Verification of token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id); // if you delete a user it find it because we just set it's active to false when we delete
      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in User
      // making it available to our templates. We can access res.locals in our templates
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
