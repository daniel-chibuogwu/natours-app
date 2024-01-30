
// This is the global error middleware and it takes in 4 parameters and this helps express recognise it as so.
// For this to catch errors pass the error into the next(error) function so that it would handle it where the function is that caused the error

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
