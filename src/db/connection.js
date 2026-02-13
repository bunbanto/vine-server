const mongoose = require('mongoose');

const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_URL, MONGODB_DB } = process.env;
const mongoDbUri = process.env.MONGO_DB_URI;

const DB_HOST =
  mongoDbUri ||
  `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_URL}/${MONGODB_DB}?retryWrites=true&w=majority`;

const connectDB = async () => {
  try {
    if (!DB_HOST || DB_HOST.includes('undefined')) {
      throw new Error('MongoDB connection string is not configured');
    }

    await mongoose.connect(DB_HOST, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Database connection successful');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
