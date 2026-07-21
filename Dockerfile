# syntax=docker/dockerfile:1.7
FROM node:24.11.1-alpine3.22 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci
FROM deps AS builder
COPY frontend frontend
RUN npm run build -w frontend
FROM node:24.11.1-alpine3.22 AS runtime
ENV NODE_ENV=production PORT=3007
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app package.json ./
COPY --chown=app:app backend ./backend
COPY --from=builder --chown=app:app /app/frontend/dist ./frontend/dist
USER app
EXPOSE 3007
CMD ["node","backend/server.js"]
