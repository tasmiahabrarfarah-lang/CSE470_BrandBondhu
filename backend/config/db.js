import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/brandbondhu', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
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
