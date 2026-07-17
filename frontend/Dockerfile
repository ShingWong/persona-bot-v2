# =============================================================================
# Frontend Dockerfile - Multi-stage build for Next.js 15 optimization
# =============================================================================
# Build: podman build -t persona-bot-frontend:latest ./frontend
# Run:   podman run -d -p 3000:3000 --env-file .env persona-bot-frontend:latest
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies (Base)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package.json

# Install dependencies with npm install (works without package-lock.json)
RUN npm install --legacy-peer-deps

# -----------------------------------------------------------------------------
# Stage 2: Development (Optional - for dev builds)
# -----------------------------------------------------------------------------
FROM base AS development

# Copy all source code
COPY . .

# Set development environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port for dev server
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Stage 3: Builder (Production build)
# -----------------------------------------------------------------------------
FROM base AS builder

# Copy all source code
COPY . .

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application with Next.js 15 optimizations
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 4: Production (Optimized runtime)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install only production dependencies in final image
COPY --from=builder /app/package.json /app/package.json
RUN npm install --omit=dev --legacy-peer-deps

# Copy built application and public assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Create necessary directories and set permissions
RUN mkdir -p .next/cache && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start Next.js production server
CMD ["npm", "start"]

# -----------------------------------------------------------------------------
# Stage 5: Standalone (Alternative production - self-contained)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS standalone

WORKDIR /app

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start standalone server
CMD ["node", "server.js"]
