FROM node:22-slim AS builder

WORKDIR /app

# Enable corepack and pin pnpm version
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Copy workspace config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/frontend/project.json apps/frontend/tsconfig.json apps/frontend/next.config.js apps/frontend/postcss.config.mjs apps/frontend/index.d.ts apps/frontend/next-env.d.ts ./apps/frontend/
COPY packages/shared/package.json packages/shared/project.json packages/shared/tsconfig*.json ./packages/shared/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/frontend/ ./apps/frontend/
COPY packages/shared/ ./packages/shared/

# NEXT_PUBLIC_ vars are inlined at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID

# Build frontend (includes shared via dependsOn)
RUN pnpm nx build frontend

# --- Production stage ---
FROM node:22-slim

WORKDIR /app

# Copy standalone server
COPY --from=builder /app/apps/frontend/.next/standalone ./

# Copy static assets and public files
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
