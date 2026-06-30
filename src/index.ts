import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Bindings, PreviewJob } from './types';
import { instagramHandler } from './platforms/instagram';
import { xHandler } from './platforms/x';
import { threadsHandler } from './platforms/threads';
import { facebookHandler } from './platforms/facebook';
import { placeholderHandler } from './platforms/placeholder';
import { discordHandler, runPreview } from './platforms/discord';

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

// Discord interactions endpoint（POST）。互動端點 URL 設為 https://discord.jumo.dev/。
app.post('/*', (c) => {
    const host = c.req.header('Host');
    if (host?.split('.')[0] === 'discord') return discordHandler(c);
    return c.text('Not found', 404);
});

// Queue consumer：處理 Discord /preview 的長時間 Browserbase 擷取（wall time 最長 15 分鐘）。
async function queue(batch: MessageBatch<PreviewJob>, env: Bindings) {
    for (const message of batch.messages) {
        try {
            await runPreview(env, message.body);
        } catch (error) {
            console.error('[queue] runPreview failed:', error);
        } finally {
            // 一律 ack：擷取昂貴且 deferred 訊息可能已編輯，重試只會重複執行。
            message.ack();
        }
    }
}

export default {
    fetch: (request: Request, env: Bindings, ctx: ExecutionContext) => app.fetch(request, env, ctx),
    queue,
};
