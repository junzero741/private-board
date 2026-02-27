FROM node:20-slim AS builder

WORKDIR /app

# Enable corepack and pin pnpm version
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Copy workspace config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/project.json apps/backend/tsconfig*.json ./apps/backend/
COPY packages/shared/package.json packages/shared/project.json packages/shared/tsconfig*.json ./packages/shared/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend/ ./apps/backend/
COPY packages/shared/ ./packages/shared/

# Generate Prisma client (native binaries for linux)
RUN cd apps/backend && npx prisma generate

# Build backend (includes shared)
RUN pnpm nx build backend

# Prune lockfile + copy workspace modules for production install
RUN pnpm nx prune backend

# --- Production stage ---
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Copy build output (includes generated package.json + lockfile)
COPY --from=builder /app/dist/apps/backend ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy Prisma schema + config for runtime migrate
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./

EXPOSE 4000

CMD ["node", "main.js"]
