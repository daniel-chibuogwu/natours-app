//Principle: Restful API must be Stateless
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// Railway uses proxies that why req.secure doesn't work in the auth controller as the proxies change the request object - We need to tell our app to trust proxies even for the rate limiter to work
app.enable('trust proxy');

// Setings for Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Implement CORS - Access-Control-Allow-Origin to * i.e everything
app.use(cors()); // we can call the middleware just for a particular route with want to implement CORS for e.g app.use('/api/v1/tours', cors(), tourRouter);
// If for instance Frontend - natour.com and Backend - api.natours.io use the below
// app.use(
//   cors({
//     origin: 'https://www.natours.com',
//   }),
// );

// .options (a preflight request or confirmation request) is similar to post, put,patch or get an http method
// we can respond to. It's not to set any options we are just using to fix CORS  issue with non-simple requests like put, patch or delete
app.options('*', cors());
// Allowing for a single route
// app.options('/api/v1/tours/:id', cors());

// Serviing Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
app.use(helmet());

// Development Logger for terminal
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// We added the webhook here because we don't want the body to be parsed
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout,
);

// Body Parser: reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

// For parsing url encoded FORM DATA
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies
app.use(cookieParser());

// Data sanitization against NoSQL query injection (removes $ and . operators {{'$gt': ""}}) won't work for login
app.use(mongoSanitize());

// Data sanitization against XSS: prevents some malicious HTML code
app.use(xss());

// Prevent Parameter Pollution (where there are duplicates parameters like for sorting it creates an array which breaks the code but this would pick the last one)
// We are whitelisting so that we can still filter when this parameters are set multiple times.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//Used to compress text
app.use(compression());
// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// Middleware to fix Security Policy issues
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://cdn.jsdelivr.net",
  );

  next();
});

// MOUNTING ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!!!🤯`, 404)); // when next receives something it automatically assumes it's an error and sends it to the global error handler for us
});

app.use(globalErrorHandler);

module.exports = app;
