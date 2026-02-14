import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
const workspaceEnvPath = path.resolve(process.cwd(), 'apps/api/.env');
const rootEnvPath = path.resolve(process.cwd(), '.env');
loadEnv({ path: existsSync(workspaceEnvPath) ? workspaceEnvPath : rootEnvPath });
const app = express();
const port = Number(process.env.PORT ?? 4010);
const databaseUrl = process.env.DATABASE_URL?.trim();
const jwtSecret = process.env.JWT_SECRET?.trim();
if (databaseUrl) {
    process.env.DATABASE_URL = databaseUrl;
}
if (jwtSecret) {
    process.env.JWT_SECRET = jwtSecret;
}
if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Set DATABASE_URL in Render service environment variables (or apps/api/.env for local development).');
}
if (process.env.NODE_ENV === 'production' && !jwtSecret) {
    throw new Error('JWT_SECRET is missing. Set JWT_SECRET in Render service environment variables.');
}
if (process.env.NODE_ENV !== 'production' && !jwtSecret) {
    console.warn('JWT_SECRET is missing. Falling back to development-only secret.');
}
function normalizeOrigin(origin) {
    return origin.trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, '');
}
function originMatchesPattern(origin, pattern) {
    if (!pattern.includes('*')) {
        return origin === pattern;
    }
    const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escapedPattern}$`).test(origin);
}
const corsOriginPatterns = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
console.log(`[CORS] raw=${process.env.CORS_ORIGIN ?? '<empty>'} normalized=${corsOriginPatterns?.length ? corsOriginPatterns.join(',') : '<allow-all>'}`);
app.use(cors({
    origin: (requestOrigin, callback) => {
        if (!requestOrigin || !corsOriginPatterns?.length) {
            callback(null, true);
            return;
        }
        const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
        const isAllowed = corsOriginPatterns.some((pattern) => originMatchesPattern(normalizedRequestOrigin, pattern));
        if (!isAllowed) {
            console.warn(`[CORS] blocked origin=${normalizedRequestOrigin} allowed=${corsOriginPatterns.length ? corsOriginPatterns.join(',') : '<allow-all>'}`);
        }
        callback(null, isAllowed);
    },
}));
app.use(express.json());
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});
app.use('/api/auth', authRouter);
app.use('/api', dashboardRouter);
app.get('/docs/openapi.json', (_req, res) => {
    res.json(openApiDocument);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
