import { existsSync } from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import cors from 'cors'
import express from 'express'
import { authRouter } from './routes/auth.js'
import { dashboardRouter } from './routes/dashboard.js'

const workspaceEnvPath = path.resolve(process.cwd(), 'apps/api/.env')
const rootEnvPath = path.resolve(process.cwd(), '.env')
loadEnv({ path: existsSync(workspaceEnvPath) ? workspaceEnvPath : rootEnvPath })

const app = express()
const port = Number(process.env.PORT ?? 4010)

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is missing. Create apps/api/.env and set DATABASE_URL=postgresql://user:pass@host:5432/dbname',
  )
}
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing. Create apps/api/.env and set JWT_SECRET.')
}
if (process.env.NODE_ENV !== 'production' && !process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is missing. Falling back to development-only secret.')
}

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api', dashboardRouter)

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
