# ------------------------------------------------------------------------------
# Stage 1: Build the React client using Vite
# ------------------------------------------------------------------------------
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Install client dependencies
COPY client/package*.json ./
RUN npm ci

# Copy client source code
COPY client/ ./

# Build arguments for frontend configuration (injected at build time if needed)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build static assets to /app/client/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Server & Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy server code
COPY server/ ./server/

# Copy generated .env file from CI/CD pipeline if present
COPY .env* ./server/

# Copy compiled static frontend from client-builder stage
COPY --from=client-builder /app/client/dist ./client/dist

# Expose port (default 5000)
EXPOSE 5000

WORKDIR /app/server

# Start the Express API server (which serves API and static React frontend)
CMD ["node", "src/server.js"]
