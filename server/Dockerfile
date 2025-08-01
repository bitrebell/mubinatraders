FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and create directories
RUN npm ci --only=production && \
    mkdir -p database uploads/notes uploads/questions uploads/avatars

# Copy application code
COPY . .

# Create non-root user and change ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 8080

CMD ["npm", "start"]
