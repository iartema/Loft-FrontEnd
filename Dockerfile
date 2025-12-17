# syntax=docker/dockerfile:1

# Builder installs deps and creates the optimized Next.js build
FROM node:20-bookworm-slim AS builder
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Drop dev deps to keep the runtime image slim
# RUN npm prune --omit=dev

# Runtime image with only what is needed to serve the app
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/src ./src

EXPOSE 3000
CMD ["npm", "run", "start"]
