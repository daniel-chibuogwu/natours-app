//Operational Errors -> CastError, ValidatorError, Duplicate Errors 1100

const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: "${
    Object.values(err.keyValue)[0]
  }". Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errorMessages = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errorMessages.join('. ')}.`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // note that all operational error are ones that were created with the app error class otherwise, it's not
  // Operational, trusted error: send  message  to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown error: don't leat error details
  } else {
    // 1) Log error
    console.error('Error 🧨', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

// This is the global error middleware and it takes in 4 parameters and this helps express recognise it as so.
// For this to catch errors pass the error into the next(error) function so that it would handle it for the error where the function is called that caused the error
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //Doing this checks to make this errors operational using our AppError Class
    let error = {};
    if (err.name === 'CastError') error = handleCastErrorDB(err); //making it an operational error
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    sendErrorProd(error, res);
  }
};
