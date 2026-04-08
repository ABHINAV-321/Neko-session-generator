# Dockerfile for WhatsApp Session Generator
# Works on Render, Railway, and any container host

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY public ./public

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY api ./api
COPY index.js ./
COPY server.js ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if(r.statusCode!==200)throw new Error('Unhealthy')})"

# Start server
CMD ["node", "server.js"]
