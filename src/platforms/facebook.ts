import type { Context } from 'hono';
import type { Bindings, BrowserbaseResult } from '../types';
import { stripTrackingParams } from '../utils/strip-params';
import { invokeBrowserbase } from '../utils/browserbase';
import { renderOgHtml, escapeHtml } from '../utils/html';

const STRIP_PARAMS = ['fbclid', 'utm_*'];

export async function facebookHandler(c: Context<{ Bindings: Bindings }>) {
    const url = new URL(c.req.url);
    let originalUrl = `https://www.facebook.com${url.pathname}${url.search}`;
    originalUrl = stripTrackingParams(originalUrl, STRIP_PARAMS);

    console.log(`[facebook] => Fetching metadata for: ${originalUrl}`);

    try {
        const response = await invokeBrowserbase(
            c.env.FUNCTION_MODE,
            c.env.JUMO_FB_FUNCTION_ID,
            'facebook',
            c.env.BROWSERBASE_API_KEY,
            { url: originalUrl, apiKey: c.env.GOOGLE_API_KEY },
        );

        if (!response.ok) {
            console.error(`[facebook] Browserbase invocation failed: ${response.status}`);
            return fallbackRedirect(c, originalUrl);
        }

        const result = await response.json<BrowserbaseResult>();

        if (!result.content && !result.author) {
            console.warn('[facebook] Empty result from Browserbase, falling back to redirect');
            return fallbackRedirect(c, originalUrl);
        }

        const title = result.author || 'Facebook Post';
        const description = result.content ?? '';
        const media = result.media ?? [];
        const images = media.filter(m => m.type === 'image').map(m => m.url);
        const videos = media.filter(m => m.type === 'video').map(m => m.url);
        // 對外顯示與轉址一律用已解析重導後的永久連結，退回原始 URL。
        const link = result.permalink ?? originalUrl;

        return c.html(renderOgHtml({
            title,
            description,
            url: link,
            images,
            videos,
            siteName: 'Facebook',
            locale: 'zh_TW',
            redirectUrl: link,
        }));
    } catch (error) {
        console.error('[facebook] Error:', error);
        return fallbackRedirect(c, originalUrl);
    }
}

function fallbackRedirect(c: Context, url: string) {
    const escaped = escapeHtml(url);
    return c.html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Facebook Post</title>
  <meta http-equiv="refresh" content="0; url=${escaped}" />
</head>
<body>
  <p>Redirecting to <a href="${escaped}">${escaped}</a>…</p>
</body>
</html>`);
}
