import type { BrowserbaseResult } from '../types';

// Discord Components V2（message flag IS_COMPONENTS_V2 = 1 << 15）用到的元件型別。
// 一旦訊息帶這個 flag，content/embeds 失效，須改用 components 呈現內文與圖片。
export type TextDisplayComponent = {
    type: 10; // TEXT_DISPLAY
    content: string;
};

export type MediaGalleryItem = {
    media: { url: string };
    description?: string;
    spoiler?: boolean;
};

export type MediaGalleryComponent = {
    type: 12; // MEDIA_GALLERY
    items: MediaGalleryItem[];
};

export type DiscordComponent = TextDisplayComponent | MediaGalleryComponent;

// message flags 需帶此值才會啟用 Components V2。
export const IS_COMPONENTS_V2 = 1 << 15;

// 平台 key => 顯示名稱。
const PLATFORM_LABELS: Record<string, string> = {
    x: 'X',
    instagram: 'Instagram',
    threads: 'Threads',
    facebook: 'Facebook',
};

// Text Display 未明訂字數上限，沿用先前 embed description 的保守值。
function truncate(str: string, max: number): string {
    return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

// 從 Browserbase 結果組成 Components V2：TextDisplay（標題/內文/footer）+ MediaGallery（圖片，可劇透）。
export function buildComponents(
    platformKey: string,
    originalUrl: string,
    result: BrowserbaseResult,
    isSpoiler = false,
): DiscordComponent[] {
    const label = PLATFORM_LABELS[platformKey] ?? platformKey;

    let title = `${label} Post`;
    if (result.author) {
        title = result.username ? `${result.author} (${result.username})` : result.author;
    }

    const lines = [`**[${truncate(title, 256)}](${originalUrl})**`];
    if (result.content) lines.push(truncate(result.content, 4000));
    if (typeof result.likes === 'number' && result.likes > 0) lines.push(`❤️ ${result.likes}`);
    lines.push(`-# ${label}`);

    const components: DiscordComponent[] = [{ type: 10, content: lines.join('\n\n') }];

    const images = result.links ?? [];
    if (images.length > 0) {
        components.push({
            type: 12,
            items: images.slice(0, 10).map((url): MediaGalleryItem => ({ media: { url }, spoiler: isSpoiler })),
        });
    }

    return components;
}

// 無 metadata（無 function / 擷取失敗）時的精簡內容，至少保留可點連結。
export function buildFallbackComponents(platformKey: string, originalUrl: string): DiscordComponent[] {
    const label = PLATFORM_LABELS[platformKey] ?? platformKey;
    return [{ type: 10, content: `**[${label} Post](${originalUrl})**\n\n${originalUrl}\n\n-# ${label}` }];
}
