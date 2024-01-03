const mongoose = require('mongoose');
const dotenv = require('dotenv');

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
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
