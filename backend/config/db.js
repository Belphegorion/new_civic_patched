// backend/config/db.js
const mongoose = require('mongoose');

const maskConnectionString = (uri = '') => {
  try {
    return uri.replace(/:\/\/(.*?):(.*?)@/, '://****:****@');
  } catch (err) {
    return '***masked***';
  }
};

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoURI) {
    console.error('[CRITICAL] MONGODB_URI (or MONGO_URI) is not set in environment. Aborting.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const host = mongoose.connection?.host || 'unknown-host';
    console.log(`[SUCCESS] MongoDB connected (host: ${host}). Connection string (masked): ${maskConnectionString(mongoURI)}`);
    return conn;
  } catch (error) {
    console.error('[CRITICAL] Mongoose connection failed:', error.message || error);
    process.exit(1);
  }
};

module.exports = connectDB;
