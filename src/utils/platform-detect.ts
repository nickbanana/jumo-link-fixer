import type { Bindings } from '../types';

// 平台對照：hostname => 設定。functionId 於執行期由 env 依 functionIdEnvKey 解析。
type PlatformEntry = {
    key: string;
    domain: string;
    stripParams: string[];
    functionIdEnvKey: keyof Bindings;
};

const PLATFORM_REGISTRY: Record<string, PlatformEntry> = {
    'x.com': { key: 'x', domain: 'https://x.com', stripParams: ['s', 't', 'ref_src', 'ref_url', 'utm_*'], functionIdEnvKey: 'JUMO_X_FUNCTION_ID' },
    'twitter.com': { key: 'x', domain: 'https://x.com', stripParams: ['s', 't', 'ref_src', 'ref_url', 'utm_*'], functionIdEnvKey: 'JUMO_X_FUNCTION_ID' },
    'instagram.com': { key: 'instagram', domain: 'https://www.instagram.com', stripParams: ['igsh', 'igshid', 'utm_*'], functionIdEnvKey: 'JUMO_IG_FUNCTION_ID' },
    'threads.net': { key: 'threads', domain: 'https://www.threads.com', stripParams: ['igsh', 'igshid', 'utm_*'], functionIdEnvKey: 'JUMO_THREADS_FUNCTION_ID' },
    'threads.com': { key: 'threads', domain: 'https://www.threads.com', stripParams: ['igsh', 'igshid', 'utm_*'], functionIdEnvKey: 'JUMO_THREADS_FUNCTION_ID' },
    'facebook.com': { key: 'facebook', domain: 'https://www.facebook.com', stripParams: ['fbclid', 'utm_*'], functionIdEnvKey: 'JUMO_FB_FUNCTION_ID' },
    'fb.com': { key: 'facebook', domain: 'https://www.facebook.com', stripParams: ['fbclid', 'utm_*'], functionIdEnvKey: 'JUMO_FB_FUNCTION_ID' },
};

export type DetectedPlatform = {
    key: string;
    originalUrl: string;
    stripParams: string[];
    functionIdEnvKey: keyof Bindings;
};

// 解析任意輸入連結，對應到支援的平台。回傳 null 代表不支援。
export function detectPlatform(rawUrl: string): DetectedPlatform | null {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl.trim());
    } catch {
        return null;
    }

    // 去掉 www. 前綴後比對 registry。
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const entry = PLATFORM_REGISTRY[host];
    if (!entry) return null;

    // 以對應的正規網域重建連結，保留 path 與 query。
    const originalUrl = `${entry.domain}${parsed.pathname}${parsed.search}`;

    return {
        key: entry.key,
        originalUrl,
        stripParams: entry.stripParams,
        functionIdEnvKey: entry.functionIdEnvKey,
    };
}
