module.exports = (fn) => (req, res, next) => {
  // req, res, next is used to call the function by express
  fn(req, res, next).catch(next); // catch needs a function and would call the function with the error as the first argument which is what we need for 'next' here
};
