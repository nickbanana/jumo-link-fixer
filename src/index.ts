import { Hono } from 'hono';
import type { Bindings } from './types';
import { instagramHandler } from './platforms/instagram';
import { xHandler } from './platforms/x';
import { threadsHandler } from './platforms/threads';
import { facebookHandler } from './platforms/facebook';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => c.text('Jumo Link Fixer is running.'));
app.get('/favicon.ico', () => new Response(null, { status: 204 }));

app.get('/*', async (c) => {
    const host = c.req.header('Host');
    if (!host) {
        return c.text('Host header is missing.', 400);
    }

    const path = new URL(c.req.url).pathname;
    const platformKey = c.env.ENVIRONMENT === 'dev'
        ? path.split('/').filter(p => p)[0]
        : host.split('.')[0];

    switch (platformKey) {
        case 'instagram': return instagramHandler(c);
        case 'x':
        case 'twitter':  return xHandler(c);
        case 'threads':  return threadsHandler(c);
        case 'facebook': return facebookHandler(c);
        default: return c.text(`Platform "${platformKey}" is not supported.`, 404);
    }
});

export default app;
