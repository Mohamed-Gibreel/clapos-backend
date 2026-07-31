# Stage 1 - Build dependencies
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2 - Build TS code
FROM base AS builder
COPY . .
RUN npm run build

# Stage 3 - Production app
FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev
CMD ["node", "dist/main.js"]
