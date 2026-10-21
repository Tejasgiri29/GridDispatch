FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV SIMULATOR_TARGET_URL=http://griddispatch-backend:8082/api/v1/telemetry/batch
ENV SIMULATOR_INTERVAL_MS=2000

CMD ["node", "dist/simulator.js"]
