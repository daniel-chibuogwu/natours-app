const multer = require('multer');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    // user-3dde8f333-9292282.jpeg
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

// Filter to allow only image file types to pass and nothing else
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    // passing true for the filter to know that it passed
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// THE MULTER UPLOAD CONFIG
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);
// Only For Admin
// Don't try to change PASSWORD using this update controller because all the 'save' middlewares would not run
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // Remember that we get the user from req.user when using a 'Protected Route' by adding it as a middleware at the route definition
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }
  // 2) Update the user document
  // we need to filter the body so that the user don't update anything (like role: 'admin') else asides the name and email.
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Updating the filename for the user image whenever a photo is uploaded
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

// We don't delete documents but just mark them as inactive in the database
exports.deleteMe = catchAsync(async (req, res, next) => {
  // remember that we get the user id from the JWT since this is a protect route that gives us access to req.user
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
