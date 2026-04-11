import { Hono } from 'hono';
import type { Bindings } from './types';
import { instagramHandler } from './platforms/instagram';
import { xHandler } from './platforms/x';
import { threadsHandler } from './platforms/threads';
import { facebookHandler } from './platforms/facebook';
import { placeholderHandler } from './platforms/placeholder';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
    const host = c.req.header('Host');
    if (host && host.split('.')[0] === 'placeholder') {
        return placeholderHandler(c);
    }
    return c.text('Jumo Link Fixer is running.');
});
app.get('/favicon.ico', () => new Response(null, { status: 204 }));

app.get('/*', async (c) => {
    const host = c.req.header('Host');
    if (!host) {
        return c.text('Host header is missing.', 400);
    }

    const platformKey = host.split('.')[0];

    switch (platformKey) {
        case 'instagram': return instagramHandler(c);
        case 'x':
        case 'twitter':  return xHandler(c);
        case 'threads':  return threadsHandler(c);
        case 'facebook': return facebookHandler(c);
        case 'placeholder': return placeholderHandler(c);
        default: return c.text(`Platform "${platformKey}" is not supported.`, 404);
    }
});

export default app;
