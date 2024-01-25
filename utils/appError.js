class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // just like calling the parent which is Error(message) it would also set the message property
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
