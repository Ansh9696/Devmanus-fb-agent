# ==============================================================================
# Devmanus Local Backend Dockerfile
# Node.js 20 lightweight container for Express & Ollama bridge
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
ENV LLM_PROVIDER=ollama
ENV OLLAMA_BASE_URL=http://host.docker.internal:11434
ENV OLLAMA_MODEL=llama3.2:1b

EXPOSE 3000

# Start backend using tsx
CMD ["npm", "start"]
