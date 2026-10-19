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

  let conn;
  try {
    conn = await mongoose.connect(uri, {
      autoIndex: env.mongoAutoIndex,
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✔ MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    if (env.nodeEnv !== 'production' && !uri.includes('mongodb+srv')) {
      console.warn(`\n⚠ Could not connect to external MongoDB at ${uri} (${err.message})`);
      console.log('⚡ Launching embedded in-memory MongoDB instance for local dev…');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      conn = await mongoose.connect(memUri, { autoIndex: env.mongoAutoIndex });
      console.log(`✔ Embedded MongoDB running → ${conn.connection.host}/${conn.connection.name}\n`);
      return conn;
    }
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
