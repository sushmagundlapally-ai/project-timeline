# Project Timeline - Docker Configuration
# Created by: Sushma Gundlapally

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm ci --only=production

# Copy server code
COPY server/ ./

# Copy frontend files
WORKDIR /app
COPY index.html ./public/
COPY styles.css ./public/
COPY script.js ./public/

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start server
WORKDIR /app/server
CMD ["node", "server.js"]

