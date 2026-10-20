import mongoose from 'mongoose';
import fs from 'fs';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  // If a real MongoDB URI is provided (e.g. MongoDB Atlas), use it
  if (mongoUri && mongoUri !== 'mongodb://localhost:27017/brandbondhu') {
    try {
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB connection failed: ${error.message}`);
      process.exit(1);
    }
  }

  // Try local MongoDB first
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/brandbondhu', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    // In production, refuse to fall back to in-memory — it loses all data on restart
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: No MONGO_URI set and cannot connect to local MongoDB in production.');
      console.error('Please set the MONGO_URI environment variable to a MongoDB Atlas connection string.');
      process.exit(1);
    }

    // In development only: fall back to in-memory MongoDB (no persistent path — just for local testing)
    console.warn(`Local MongoDB not detected (${error.message}). Spinning up In-Memory MongoDB Server...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`In-Memory MongoDB Connected successfully at ${conn.connection.host}`);
    } catch (memErr) {
      console.error('Failed to start In-Memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

export default connectDB;
