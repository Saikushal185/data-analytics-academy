# Single-image build: installs deps, builds the client, serves everything from Express.
FROM node:20-bookworm-slim

# Build tools for better-sqlite3 native module.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all workspaces (root postinstall installs server + client).
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install

# Copy source and build the client.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001
# Persist SQLite on a mounted volume in production.
ENV DATA_DIR=/data
VOLUME /data
EXPOSE 3001

CMD ["node", "server/index.js"]
