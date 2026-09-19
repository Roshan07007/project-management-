const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Ensure dotenv is loaded from backend/.env (strict override in normal mode, flexible in test mode)
if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false });
}

/**
 * Connect to MongoDB Atlas using Mongoose.
 * MONGO_URI is loaded strictly from backend/.env.
 */
const connectDB = async () => {
  let mongoURI = (process.env.MONGO_URI || '').trim();

  // Strip accidental surrounding single quotes, double quotes, or markdown backticks
  if (
    (mongoURI.startsWith('"') && mongoURI.endsWith('"')) ||
    (mongoURI.startsWith("'") && mongoURI.endsWith("'")) ||
    (mongoURI.startsWith('`') && mongoURI.endsWith('`'))
  ) {
    mongoURI = mongoURI.slice(1, -1).trim();
  }

  // 1. Missing or empty MONGO_URI
  if (!mongoURI) {
    throw new Error(
      'Database connection failed: MONGO_URI is not defined or is empty in backend/.env. Please paste your MongoDB Atlas connection string (starting with "mongodb+srv://" or "mongodb://") into backend/.env.'
    );
  }

  // 2. Unresolved placeholder detection
  if (
    mongoURI === '<MY_MONGODB_ATLAS_CONNECTION_STRING>' ||
    mongoURI.startsWith('<') ||
    mongoURI.endsWith('>') ||
    mongoURI.includes('<password>') ||
    mongoURI.includes('<username>')
  ) {
    throw new Error(
      'Invalid connection string: MONGO_URI in backend/.env contains placeholder text. Please replace it with your actual MongoDB Atlas connection URI.'
    );
  }

  // 3. Scheme validation
  if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
    throw new Error(
      'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://". Please replace the placeholder in backend/.env with your actual MongoDB Atlas connection URI.'
    );
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log('[MongoDB] Connected successfully to MongoDB Atlas');
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;



