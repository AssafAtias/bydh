# PlanYourHome

React + Node + Postgres app for planning house construction costs in Israel, including family income, investments, savings, and scenario stress tests.

## Stack

- `apps/web`: React + Vite + MUI + React Query
- `apps/api`: Express + Prisma + PostgreSQL
- `packages/shared`: shared TypeScript/Zod contracts
- Deploy target: Vercel (`web`) + Render (`api` + Postgres)

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Run Prisma migration + seed:

```bash
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
npm run prisma:seed -w apps/api
```

4. Start API and web in separate terminals:

```bash
npm run dev:api
npm run dev
```

## API endpoints

- `GET /health`
- `GET /api/finances`
- `GET /api/build`
- `GET /api/scenarios`

## Deployment

### Vercel (web)

- Root directory: `apps/web`
- Build command: `npm run build -w apps/web`
- Output directory: `apps/web/dist`
- Env var: `VITE_API_URL=https://<your-render-api>/api`

### Render (api)

- Root directory: repo root
- Build command: `npm install && npm run prisma:generate -w apps/api && npm run build -w apps/api`
- Start command: `npm run start -w apps/api`
- Env vars:
  - `DATABASE_URL`
  - `PORT`
  - `CORS_ORIGIN=https://<your-vercel-domain>`

Use Render managed Postgres and run migrations during deploy:

```bash
npm run prisma:migrate -w apps/api
```
