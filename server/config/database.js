const mongoose = require('mongoose');
require('dotenv').config();

exports.connect = () => {
  mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('DB Connection successful');
    })
    .catch((err) => {
      console.log('error connecting database ');
      console.error(err);
      process.exit(1);
    });
};
