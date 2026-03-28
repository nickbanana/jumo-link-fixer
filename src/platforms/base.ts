import type { Context } from 'hono';
import type { Bindings, BrowserbaseResult } from '../types';
import { invokeBrowserbase } from '../utils/browserbase';
import { renderOgHtml, renderErrorHtml } from '../utils/html';

export type PlatformConfig = {
    key: string;
    domain: string;
}

export function createPlatformHandler(config: PlatformConfig) {
    return async (c: Context<{ Bindings: Bindings }>) => {
        const url = new URL(c.req.url);
        const path = url.pathname;

        const actualPath = c.env.ENVIRONMENT === 'dev'
            ? `/${path.split('/').filter(p => p).slice(1).join('/')}`
            : path;

        const originalUrl = `${config.domain}${actualPath}`;
        console.log(`[${config.key}] => Fetching content for: ${originalUrl}`);

        const bbResponse = await invokeBrowserbase(
            c.env.BROWSERBASE_FUNCTION_ID,
            c.env.BROWSERBASE_API_KEY,
            { url: originalUrl, platform: config.key }
        );

        if (!bbResponse.ok) {
            return c.html(renderErrorHtml(originalUrl, bbResponse.status), 502);
        }

        const result = await bbResponse.json() as BrowserbaseResult;

        return c.html(renderOgHtml({
            title: result.author ? `@${result.author}` : config.key,
            description: result.content ?? '',
            url: originalUrl,
            images: result.links ?? [],
        }));
    };
}
