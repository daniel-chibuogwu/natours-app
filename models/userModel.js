const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
      validate: {
        // This only works on CREATE and SAVE!!!
        validator(el) {
          return el === this.password; // must be ture to pass
        },
        message: 'Passwords are not thesame',
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
//MIDDLEWARES
userSchema.pre('save', async function (next) {
  // Only runs when the password and "no other field" is created or modified
  if (!this.isModified('password')) return next();
  // Hash the password asychronously with a cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete passwordConfirm as we don't need it in the DB even though it's a required input
  this.passwordConfirm = undefined;
  // Go to next middleware
  next();
});

//Model provides an interface for interacting with documents in that collection.
const User = mongoose.model('User', userSchema);

module.exports = User;
