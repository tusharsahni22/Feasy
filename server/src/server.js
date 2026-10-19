import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  try {
    await connectDB();
    const app = createApp();
    app.listen(env.port, () => {
      console.log(`\n  Feasy API ready → http://localhost:${env.port}`);
      console.log(`  Health check       → http://localhost:${env.port}/api/health\n`);
    });
  } catch (err) {
    console.error('✖ Failed to start server:', err.message);
    console.error('  Is MongoDB running and MONGODB_URI correct?');
    process.exit(1);
  }
}

start();
