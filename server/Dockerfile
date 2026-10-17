# ==============================================================================
# Devmanus Local Backend Dockerfile
# Node.js 20 lightweight container for Express static preview & API
# ==============================================================================
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for Docker caching
COPY package*.json ./
RUN npm install

# Copy source code and config
COPY tsconfig.json ./
COPY src/ ./src/

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Start backend using tsx
CMD ["npm", "start"]
