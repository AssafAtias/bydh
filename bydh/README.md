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

### 1) Render (API + Postgres)

This repo includes `render.yaml`, so you can deploy with Render Blueprint:

1. In Render: **New +** -> **Blueprint**
2. Select this GitHub repo/branch
3. Render creates:
   - `bydh-postgres` (managed Postgres)
   - `bydh-api` (Node web service)
4. In `bydh-api` service env vars, set:
   - `CORS_ORIGIN=https://<your-vercel-domain>`
5. Deploy

`render.yaml` already runs:
- build: install deps + Prisma generate + API build
- start: Prisma `migrate deploy` + API start

After deploy, verify:
- `GET https://<your-render-api>/health`

### 2) Vercel (web)

This repo includes root `vercel.json` for monorepo build config.

1. In Vercel: **Add New...** -> **Project**
2. Import this GitHub repo
3. Keep root as repository root (do not change to `apps/web`)
4. Set env var:
   - `VITE_API_URL=https://<your-render-api>/api`
5. Deploy

### 3) Final wiring

After Vercel gives you a production URL:

1. Update Render `CORS_ORIGIN` to your Vercel URL
2. Redeploy `bydh-api`
3. Test register/login and data CRUD from the Vercel app

## Release

Tag and publish from your local repo:

```bash
git tag -a v1.0.0 -m "First production release"
git push origin v1.0.0
```

Then in GitHub:
- Open **Releases** -> **Draft a new release**
- Choose tag `v1.0.0`
- Publish release notes
