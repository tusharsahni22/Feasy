import mongoose from 'mongoose';
import { env } from './env.js';

let listenersBound = false;

/**
 * Connect to MongoDB (local or MongoDB Atlas) and return the connection.
 * TLS and retryWrites are supplied by the Atlas SRV connection string itself,
 * so nothing extra is needed for Atlas beyond a correct MONGODB_URI.
 * Throws on the initial failure so the caller can decide how to handle it.
 */
export async function connectDB(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);

  // Log connection lifecycle once — useful when Atlas briefly drops/reconnects.
  if (!listenersBound) {
    mongoose.connection.on('error', (err) => console.error('✖ MongoDB error:', err.message));
    mongoose.connection.on('disconnected', () => console.warn('… MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => console.log('✔ MongoDB reconnected'));
    listenersBound = true;
  }

  const conn = await mongoose.connect(uri, {
    autoIndex: env.mongoAutoIndex,
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`✔ MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
