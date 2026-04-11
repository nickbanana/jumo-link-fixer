import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Bindings } from './types';
import { instagramHandler } from './platforms/instagram';
import { xHandler } from './platforms/x';
import { threadsHandler } from './platforms/threads';
import { facebookHandler } from './platforms/facebook';
import { placeholderHandler } from './platforms/placeholder';

const app = new Hono<{ Bindings: Bindings }>();

function dispatchPlatform(c: Context<{ Bindings: Bindings }>) {
    const host = c.req.header('Host');
    if (!host) return null;

    const platformKey = host.split('.')[0];

    switch (platformKey) {
        case 'instagram': return instagramHandler(c);
        case 'x':
        case 'twitter':  return xHandler(c);
        case 'threads':  return threadsHandler(c);
        case 'facebook': return facebookHandler(c);
        case 'placeholder': return placeholderHandler(c);
        default: return null;
    }
}

app.get('/', (c) => {
    const dispatched = dispatchPlatform(c);
    if (dispatched) return dispatched;
    return c.text('Jumo Link Fixer is running.');
});
app.get('/favicon.ico', () => new Response(null, { status: 204 }));

app.get('/*', async (c) => {
    const host = c.req.header('Host');
    if (!host) {
        return c.text('Host header is missing.', 400);
    }

    const dispatched = dispatchPlatform(c);
    if (dispatched) return dispatched;

    const platformKey = host.split('.')[0];
    return c.text(`Platform "${platformKey}" is not supported.`, 404);
});

export default app;
