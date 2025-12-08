# -----------------------
# 1. Build stage
# -----------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the production bundle
RUN npm run build

# -----------------------
# 2. Nginx stage
# -----------------------
FROM nginx:stable-alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy build output from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 5090 (frontend)
EXPOSE 5090

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
