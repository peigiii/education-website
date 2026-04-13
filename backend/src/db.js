const mongoose = require('mongoose');
require('dotenv').config();

const dbURI = process.env.MONGODB_URI;

async function connectDB() {
  if (!dbURI) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env in this folder and configure it.');
  }
  await mongoose.connect(dbURI);
}

module.exports = { connectDB };
