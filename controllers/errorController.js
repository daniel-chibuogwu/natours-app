//Operational Errors -> CastError, ValidatorError, Duplicate Errors 1100

const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const message = `Duplicate field value: "${
    Object.values(err.keyValue)[0]
  }". Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errorMessages = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data! ${errorMessages.join('. ')}.`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again!', 401);

// Functions For handling error responses for dev and production
const sendErrorDev = (err, req, res) => {
  // A) FOR API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // B) FOR RENDERED WEBSITE
  console.error('Error 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // note that all operational error are ones that were created with the app error class otherwise, it's not
  // A) FOR API /////////////////////////////////////
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send  message  to the client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // Programming or other unknown error: don't leat error details
    }
    // 1) Log error
    console.error('Error 💥', err);

    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  // B) FOR RENDERED WEBSITE /////////////////////////////////////
  // Operationa or Trusted error: send  message  to the client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
    // Programming or other unknown error: don't leat error details
  }
  // 1) Log error
  console.error('Error 💥', err);

  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

// This is the global error middleware and it takes in 4 parameters and this helps express recognise it as so.
// For this to catch errors pass the error into the next(error) function so that it would handle it for the error where the function is called that caused the error
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //Doing this checks to make this errors operational using our AppError Class
    let error = Object.assign(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error); //making it an operational error
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);

    sendErrorProd(error, req, res);
  }
};
