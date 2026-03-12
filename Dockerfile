# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server/ server/
COPY tsconfig.json ./
COPY --from=builder /app/dist/ dist/
ENV NODE_ENV=production
EXPOSE 4747
CMD ["npx", "tsx", "server/index.ts"]
