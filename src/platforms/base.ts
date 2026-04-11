import type { Context } from 'hono';
import type { Bindings } from '../types';
import { escapeHtml } from '../utils/html';
import { stripTrackingParams } from '../utils/strip-params';

export type PlatformConfig = {
    key: string;
    domain: string;
    stripParams?: string[];
}

export function createPlatformHandler(config: PlatformConfig) {
    return async (c: Context<{ Bindings: Bindings }>) => {
        const url = new URL(c.req.url);

        let originalUrl = `${config.domain}${url.pathname}${url.search}`;

        if (config.stripParams && config.stripParams.length > 0) {
            originalUrl = stripTrackingParams(originalUrl, config.stripParams);
        }

        console.log(`[${config.key}] => Redirecting to: ${originalUrl}`);

        const escaped = escapeHtml(originalUrl);
        return c.html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=${escaped}" />
</head>
<body>
  <p>Redirecting to <a href="${escaped}">${escaped}</a>…</p>
</body>
</html>`);
    };
}
