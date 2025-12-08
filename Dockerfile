# -----------------------
# 1. Build stage
# -----------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the production bundle
RUN npm run build

# -----------------------
# 2. Nginx stage
# -----------------------
FROM nginx:stable-alpine

# Copy build output to nginx directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5090

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
