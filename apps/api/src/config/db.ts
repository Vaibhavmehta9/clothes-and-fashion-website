import mongoose from 'mongoose';
import env from './env';

const RETRY_LIMIT = 5;
let retryCount = 0;

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Reconnecting...');
      if (retryCount < RETRY_LIMIT) {
        retryCount++;
        setTimeout(connectDB, 5000);
      }
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${(error as Error).message}`);
    if (retryCount < RETRY_LIMIT) {
      retryCount++;
      console.log(`Retrying connection... (${retryCount}/${RETRY_LIMIT})`);
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

export default connectDB;
