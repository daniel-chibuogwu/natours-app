const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// This works because of closures in JS - meaning that inner functions would get access to variables in an outer function even after it has returned or been called in the past
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError(`No document found with ID: ${req.params.id}`, 404),
      );
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
