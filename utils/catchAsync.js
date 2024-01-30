module.exports = (fn) => (req, res, next) => {
  // req, res, next is used to call the function by express
  fn(req, res, next).catch(next);
};
