import type { Context } from 'hono';
import type { Bindings, BrowserbaseResult } from '../types';
import { stripTrackingParams } from '../utils/strip-params';
import { invokeBrowserbase } from '../utils/browserbase';
import { renderOgHtml, escapeHtml } from '../utils/html';

const STRIP_PARAMS = ['s', 't', 'ref_src', 'ref_url', 'utm_*'];

export async function xHandler(c: Context<{ Bindings: Bindings }>) {
    const url = new URL(c.req.url);

    let originalUrl = `https://x.com${url.pathname}${url.search}`;
    originalUrl = stripTrackingParams(originalUrl, STRIP_PARAMS);

    console.log(`[x] => Fetching metadata for: ${originalUrl}`);

    try {
        const response = await invokeBrowserbase(
            c.env.FUNCTION_MODE,
            c.env.JUMO_X_FUNCTION_ID,
            'x',
            c.env.BROWSERBASE_API_KEY,
            { url: originalUrl, apiKey: c.env.GOOGLE_API_KEY },
        );

        if (!response.ok) {
            console.error(`[x] Browserbase invocation failed: ${response.status}`);
            return fallbackRedirect(c, originalUrl);
        }

        const result = await response.json<BrowserbaseResult>();

        if (!result.content && !result.author) {
            console.warn('[x] Empty result from Browserbase, falling back to redirect');
            return fallbackRedirect(c, originalUrl);
        }

        const title = result.author
            ? `${result.author} (${result.username ?? ''})`
            : 'X Post';
        const description = result.content ?? '';
        const images = result.links ?? [];

        return c.html(renderOgHtml({
            title,
            description,
            url: originalUrl,
            images,
            redirectUrl: originalUrl,
        }));
    } catch (error) {
        console.error('[x] Error:', error);
        return fallbackRedirect(c, originalUrl);
    }
}

function fallbackRedirect(c: Context, url: string) {
    const escaped = escapeHtml(url);
    return c.html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>X Post</title>
  <meta http-equiv="refresh" content="0; url=${escaped}" />
</head>
<body>
  <p>Redirecting to <a href="${escaped}">${escaped}</a>…</p>
</body>
</html>`);
}
