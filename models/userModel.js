const mongoose = require('mongoose');
const validator = require('validator');

//Schema defines the structure of documents in a MongoDB collection,
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name must be provided'],
      trim: true,
      maxLength: [40, 'Name must have less than or equal to 40 characters'],
      minLength: [3, 'A tour name must have more than 10 Characters'],
    },
    email: {
      type: String,
      required: [true, 'Email must be provided'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: String,
    password: {
      type: String,
      required: [true, 'Password must be provided'],
      minLength: [8, 'Password must have at least 8 Characters'],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//Model provides an interface for interacting with documents in that collection.
const User = mongoose.model('User', userSchema);

module.exports = User;
