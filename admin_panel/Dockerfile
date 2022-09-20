# Library Build Stage
# ---
FROM node:16 AS lib-builder
WORKDIR /opt/app

COPY shared .
RUN ./build.sh

# Build Stage
# ---
FROM node:16 AS builder
WORKDIR /opt/app

COPY admin_panel/package*.json ./
RUN npm install --omit optional
COPY admin_panel .
COPY --from=lib-builder /opt/app /opt/node_modules
RUN npm run build

# Run Stage
# ---
FROM nginx

COPY --from=builder /opt/app/dist /usr/share/nginx/html
