# syntax=docker/dockerfile:1

# Feasy — single production image.
# Builds the React client, installs production server dependencies, and serves
# both the API and the compiled front-end from one Node process.
# MongoDB is expected to be external (MongoDB Atlas) — see server/.env.

# ─────────────────────────  1. Build the React client  ─────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
# Install deps first (better layer caching)
COPY client/package.json client/package-lock.json ./
RUN npm ci
# Build the SPA. VITE_API_URL is intentionally left blank so the client calls
# "/api" relative to its own origin — the same server serves it in production.
COPY client/ ./
RUN npm run build

# ─────────────────────────  2. Install prod server deps  ───────────────────────
FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# ─────────────────────────  3. Slim runtime image  ─────────────────────────────
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app

# Run as an unprivileged user
RUN addgroup -S nodejs && adduser -S -G nodejs nodejs

# Server code + production node_modules
COPY --chown=nodejs:nodejs server/package.json server/package-lock.json ./server/
COPY --from=server-deps --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules
COPY --chown=nodejs:nodejs server/src ./server/src

# Built client — Express serves this from client/dist (../../client/dist).
COPY --from=client-build --chown=nodejs:nodejs /app/client/dist ./client/dist

USER nodejs
EXPOSE 5000

# Container health = API responding on /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||5000,path:'/api/health'},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

WORKDIR /app/server
CMD ["node", "src/server.js"]
