import type { BrowserbaseResult } from '../types';

// Discord embed 物件（僅用到的欄位）。
export type DiscordEmbed = {
    title?: string;
    description?: string;
    url?: string;
    image?: { url: string };
    footer?: { text: string };
    fields?: { name: string; value: string; inline?: boolean }[];
    color?: number;
};

// 平台 key => 顯示名稱。
const PLATFORM_LABELS: Record<string, string> = {
    x: 'X',
    instagram: 'Instagram',
    threads: 'Threads',
    facebook: 'Facebook',
};

// Discord embed 限制：title 256 / description 4096。保守截斷。
function truncate(str: string, max: number): string {
    return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

// 從 Browserbase 結果組成 Discord rich embed（可能含多張圖：共用同一 url 形成圖庫）。
export function buildEmbeds(
    platformKey: string,
    originalUrl: string,
    result: BrowserbaseResult,
    isSpoiler = false,
): DiscordEmbed[] {
    const label = PLATFORM_LABELS[platformKey] ?? platformKey;

    const title = result.author
        ? truncate(result.username ? `${result.author} (${result.username})` : result.author, 256)
        : `${label} Post`;

    const base: DiscordEmbed = {
        title,
        description: result.content ? truncate(result.content, 4096) : undefined,
        url: originalUrl,
        footer: { text: label },
    };

    if (typeof result.likes === 'number' && result.likes > 0) {
        base.fields = [{ name: '❤️ Likes', value: String(result.likes), inline: true }];
    }

    const images = result.links ?? [];
    if (images.length === 0) {
        return [base];
    }

    // embed 的 image.url 欄位本身不支援劇透標記，僅文字/連結可用 ||…||。
    // 劇透模式下不直接顯示圖片，改把連結以劇透文字列在 description，需點擊才會顯示。
    if (isSpoiler) {
        const spoilerLinks = images.map((img) => `||${img}||`).join('\n');
        base.description = base.description ? `${base.description}\n\n${spoilerLinks}` : spoilerLinks;
        return [base];
    }

    // 第一張掛在主 embed；其餘各自一個 embed 但共用同一 url，Discord 會合併成圖庫。
    base.image = { url: images[0]! };
    const gallery = images.slice(1, 4).map((img): DiscordEmbed => ({
        url: originalUrl,
        image: { url: img },
    }));

    return [base, ...gallery];
}

// 無 metadata（無 function / 擷取失敗）時的精簡 embed，至少保留可點連結。
export function buildFallbackEmbed(platformKey: string, originalUrl: string): DiscordEmbed {
    const label = PLATFORM_LABELS[platformKey] ?? platformKey;
    return {
        title: `${label} Post`,
        url: originalUrl,
        description: originalUrl,
        footer: { text: label },
    };
}
