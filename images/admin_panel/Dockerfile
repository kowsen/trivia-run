# Deps Build Stage
# ---
FROM node:16 AS deps-builder
WORKDIR /opt/app

COPY .deps/libraries/game_socket/package*.json ./
RUN npm install --omit optional
COPY .deps/libraries/game_socket .
RUN npm run build

# Build Stage
# ---
FROM node:16 AS builder
WORKDIR /opt/app

COPY --from=deps-builder /opt/app /opt/node_modules/game-socket

COPY package*.json ./
RUN npm install --omit optional
COPY . .
RUN npm run build

# Run Stage
# ---
FROM nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /opt/app/dist /usr/share/nginx/html
