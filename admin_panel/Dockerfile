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
RUN rm -rf node_modules && npm i --production --ignore-scripts

# Run Stage
# ---
FROM gcr.io/distroless/nodejs:16

USER nobody

COPY --chown=nobody --from=lib-builder /opt/app /opt/node_modules
COPY --chown=nobody --from=builder /opt/app /opt/app
WORKDIR /opt/app

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV PATH /opt/node_app/node_modules/.bin:$PATH

CMD ["dist/main.js"]
