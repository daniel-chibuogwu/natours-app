const mongoose = require('mongoose');
const dotenv = require('dotenv');

// UNCAUGHT EXCEPTIONS: all synchronous errors or bugs caught in our code but are not handled anywhere
// We put this at the top so that it can catch all synchronous errors in our app unlike the one for async operations
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './.env' }); // reading our variables from the file to the node process.env;

// Needs to run after our env config because we need the env variables for our Logger
const app = require('./app');

// Connect to DB
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful!🍻');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handling unhandled Rejections GLOBALLY (FOR ASYCHRONOUS CODE) by subscribing to an event that gets trigger by the 'process' using this event listener
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // Killing the server "Gracefully" by doing it like thiss
  server.close(() => {
    process.exit(1);
  });
});
