# Build Stage
# ---
FROM node:16 AS builder
WORKDIR /opt/app

COPY package*.json ./
RUN npm install --omit optional
COPY . .
RUN npm run build
RUN rm -rf node_modules && npm i --production --ignore-scripts

# Run Stage
# ---
FROM gcr.io/distroless/nodejs:16

COPY --from=builder /opt/app /opt/app
COPY .deps/keys /opt/app/keys
WORKDIR /opt/app

RUN ls /opt/app
RUN ls /opt/app/keys
RUN ls /opt/app/.deps
RUN ls /opt/app/.deps/keys

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV PATH /opt/node_app/node_modules/.bin:$PATH

CMD ["dist/main.js"]
