# Use the official uv Debian image as base
FROM ghcr.io/astral-sh/uv:debian

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
  curl \
  gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Verify Node.js and npm installation
RUN node --version && npm --version

# Verify uv is installed correctly
RUN uv --version

# Verify npx is available
RUN npx --version || npm install -g npx

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Expose the application port
EXPOSE 3000

# Run the application
ENTRYPOINT ["node", "dist/index.js"] 