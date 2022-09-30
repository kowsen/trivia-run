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
RUN rm -rf node_modules && npm i --production --ignore-scripts

# Volume Stage
# ---
FROM alpine AS volumes
WORKDIR /opt/app

RUN mkdir -p /opt/app/files

# Run Stage
# ---
FROM gcr.io/distroless/nodejs:16

COPY --from=deps-builder /opt/app /opt/node_modules/game-socket
COPY --from=builder /opt/app /opt/app
WORKDIR /opt/app

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV PATH /opt/node_app/node_modules/.bin:$PATH

CMD ["dist/main.js"]
