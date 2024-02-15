class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // just like calling the parent which is Error(message) it would also set the message property
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // the are all the errors we created ourselves using this class

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
