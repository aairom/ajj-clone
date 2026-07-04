# ── Stage 1: build ───────────────────────────────────────────────────────────
# node:20-alpine already ships python3 / make / g++ via build-base
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine

# sharp needs libvips at runtime; better-sqlite3 & bcrypt need libstdc++
RUN apk add --no-cache libstdc++ vips

WORKDIR /app

# Copy compiled node_modules from builder stage only
COPY --from=builder /app/node_modules ./node_modules

# Copy application source (no node_modules, no .env, no data — handled by .dockerignore)
COPY . .

# Runtime directories — owned by node user before privilege drop
RUN mkdir -p /app/data /app/uploads /app/logs \
    && chown -R node:node /app/data /app/uploads /app/logs

# Drop privileges — run as node user (uid 1000, built into node:alpine)
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

CMD ["node", "server.js"]
