## Multi-stage Dockerfile for React (Vite) frontend

# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Backend API URL (injected at build time)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Copy dependency manifests first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the frontend source code
COPY . .

# Build the production-ready static assets
RUN npm run build


# Stage 2: Nginx serve stage
FROM nginx:alpine AS production

# Copy built assets from the build stage to Nginx's web root
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Use the default Nginx startup command
CMD ["nginx", "-g", "daemon off;"]

