const crypto = require('crypto');
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
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Password must be provided'],
      minLength: [8, 'Password must have at least 8 Characters'],
      select: false, //  Hidden it from our response output
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This validation only works when you CREATE or SAVE!!!
        validator(el) {
          return el === this.password; // must be True to pass
        },
        message: 'Passwords are not thesame',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//////////////////   MIDDLEWARES   ////////////////

////// PASSWORD ENCRYPTION MIDDLEWARE
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

//////////// UPDATING THE changedPasswordAt property when password is change for 'old' and modified documents
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  // we are substracting 1s because somethings the JWT is created before this property is persisted to the DB, hence it would have a higher time than JWT and users won't be able to sign in
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/////// Using a query middleware before getting all users so as to leave out deactivated or deleted users
userSchema.pre(/^find/, function (next) {
  // 'this' points to the current query
  this.find({ active: { $ne: false } });
  next();
});

////////////////// Creating An Instance (document are instances of a model) Method on all document created with this Schema. So this method would be available on all user documents
userSchema.methods.correctPassword = async function (
  candidatePassword, // password input
  encryptedPassword, // encrypted password in DB
) {
  return await bcrypt.compare(candidatePassword, encryptedPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp; // return true or false
  }
  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken; // returning unencrypted token to be sent to users email
};

//////////////////   Model provides an interface for interacting with documents in that collection.  ///////////////////////////
const User = mongoose.model('User', userSchema);

module.exports = User;
