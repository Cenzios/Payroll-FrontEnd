# Build stage
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Nginx stage
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Default = prod values
ENV NGINX_PORT=6080
ENV API_URL=https://payrollserver.cenzios.com/api/

# Replace both variables at container startup
CMD ["/bin/sh", "-c", "envsubst '${NGINX_PORT} ${API_URL}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf && cp /tmp/default.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

EXPOSE 6080
EXPOSE 5090