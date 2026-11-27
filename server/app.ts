import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { shows } from './routes/shows/index.ts';
import { handleError } from './routes/utils/handleError/index.ts';

export const app = new Hono().basePath('/api');

app.use(
  '/*',
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'X-Client-Id'],
    allowMethods: ['GET', 'PUT', 'DELETE'],
    maxAge: 600,
  }),
);

app.onError(handleError);

app.get('/health', (c) => c.json({ ok: true }));

app.route('/shows', shows);
