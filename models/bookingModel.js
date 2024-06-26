const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User.'],
  },
  // Need the price incase the tour price changes in the future so that we can know how much the user actually paid
  price: {
    type: Number,
    required: [true, 'Booking must have a price.'],
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});
// Improving read performance for reading
bookingSchema.index({ user: 1, tour: 1 });

// We can populate this query for all the booking because only the admin and guides have access to it so performance wouldn't be a problem
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
