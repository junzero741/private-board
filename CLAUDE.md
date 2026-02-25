# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Concept

→ [`docs/concept.md`](docs/concept.md) — 서비스 소개, 핵심 시나리오, 기능 목록
→ [`docs/technical.md`](docs/technical.md) — 데이터 모델, 보안 설계, 이미지 업로드 플로우, 인프라 결정

## Stack

- **Monorepo**: Nx 22 + pnpm workspaces
- **Frontend**: Next.js (`apps/frontend`)
- **Backend**: Express (`apps/backend`)
- **Shared**: Common types/utils (`packages/shared`)
- **DB**: PostgreSQL + Prisma 7 (schema at `apps/backend/prisma/schema.prisma`)

## Commands

### Dev servers
```bash
pnpm nx dev frontend          # Next.js dev server (port 3000)
pnpm nx serve backend         # Express dev server
pnpm nx run-many -t dev,serve # Both simultaneously
```

### Build
```bash
pnpm nx build frontend
pnpm nx build backend
pnpm nx run-many -t build
```

### Test
```bash
pnpm nx test shared
pnpm nx test shared --testFile=path/to/file.spec.ts  # Single file
```

### Lint
```bash
pnpm nx lint shared
pnpm nx run-many -t lint
```

### Database (Prisma — run from `apps/backend/`)
```bash
pnpm exec prisma migrate dev --name <name>  # Create and apply migration
pnpm exec prisma migrate dev                # Apply pending migrations
pnpm exec prisma generate                   # Regenerate client after schema change
pnpm exec prisma studio                     # GUI
```

## Architecture

### Directory structure
```
apps/
  frontend/          Next.js app (App Router)
  frontend-e2e/      Playwright e2e tests for frontend
  backend/           Express API server
    prisma/          Prisma schema and migrations
    prisma.config.ts Prisma 7 config (reads DATABASE_URL via dotenv)
packages/
  shared/            Shared TypeScript types and utilities
```

### Shared package import alias
`packages/shared` is aliased as `@private-board/shared` in `tsconfig.base.json`.
Both `apps/frontend` and `apps/backend` can import from it directly:
```ts
import { SomeType } from '@private-board/shared'
```

### Environment variables
- `apps/backend/.env` — `DATABASE_URL` (gitignored; copy from `.env.example`)
- `apps/frontend/.env.local` — `NEXT_PUBLIC_API_URL` and other frontend env vars

### Prisma client output
Generated client is written to `apps/backend/generated/prisma` (gitignored).
Always run `prisma generate` after modifying `schema.prisma`.
