import { Hono } from 'hono';
import { cors } from 'hono/cors';

export const app = new Hono().basePath('/api');

app.use(
  '/*',
  cors({
    origin:
      process.env.NODE_ENV === 'development' ? 'http://localhost:5173/' : 'http://example.com',
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  }),
);

app.get('/health', (c) => c.json({ ok: true }));
