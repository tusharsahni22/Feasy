import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Build and configure the Express app (no DB connection or listen here). */
export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl === '*' ? true : [env.clientUrl],
      credentials: true,
    })
  );
  app.use(express.json());
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  // Location of the built React client (client/dist). In the Docker image this
  // resolves to /app/client/dist; in local dev it usually doesn't exist yet.
  const clientDist = env.clientDist
    ? path.resolve(env.clientDist)
    : path.resolve(__dirname, '../../client/dist');
  const hasClientBuild = fs.existsSync(path.join(clientDist, 'index.html'));

  // Serve the compiled front-end (and its hashed assets) when a build is present.
  if (hasClientBuild) app.use(express.static(clientDist));

  // REST API
  app.use('/api', routes);
  app.use('/api', notFound); // JSON 404 for unknown /api/* routes

  if (hasClientBuild) {
    // SPA fallback: send index.html for any non-API GET so client-side routing
    // (React Router) works on refresh and deep links.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    // API-only mode (development, or before the client has been built).
    app.get('/', (req, res) =>
      res.json({ name: 'Feasy API', docs: '/api/health' })
    );
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
