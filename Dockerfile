FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy all source files
COPY . .

# Expose standard port for Hugging Face Spaces / Koyeb / Render
EXPOSE 7860

ENV PORT=7860
ENV NODE_ENV=production

# Start WhatsApp Bot Gateway
CMD ["npx", "tsx", "scripts/wa-gateway.ts"]
