import type { Context } from 'hono';
import type { Bindings } from '../types';
import { escapeHtml } from '../utils/html';

type MetaTag =
    | { kind: 'property'; name: string; content: string }
    | { kind: 'name'; name: string; content: string };

const SAMPLE_IMAGE = 'https://placehold.co/1200x630/png?text=og-image';
const SAMPLE_VIDEO = 'https://placehold.co/1280x720.mp4';

const EXTRA_IMAGES: { url: string; width: number; height: number; alt: string }[] = [
    { url: 'https://placehold.co/600x600/png?text=square', width: 600, height: 600, alt: '正方形 600x600' },
    { url: 'https://placehold.co/1920x1080/png?text=fullhd', width: 1920, height: 1080, alt: '大張橫向 1920x1080' },
    { url: 'https://placehold.co/400x800/png?text=portrait', width: 400, height: 800, alt: '直向 400x800' },
    { url: 'https://placehold.co/1080x1080/png?text=large-square', width: 1080, height: 1080, alt: '大正方形 1080x1080' },
    { url: 'https://placehold.co/2400x1260/png?text=ultrawide', width: 2400, height: 1260, alt: '超寬 2400x1260' },
];

const BASIC_OG: MetaTag[] = [
    { kind: 'property', name: 'og:title', content: '[og:title] Placeholder 範例標題' },
    { kind: 'property', name: 'og:description', content: '[og:description] 這段文字來自 og:description，用來驗證 Discord 會把描述顯示在哪裡。' },
    { kind: 'property', name: 'og:url', content: '[og:url] https://placeholder.jumo.dev/basic' },
    { kind: 'property', name: 'og:image', content: SAMPLE_IMAGE },
    { kind: 'property', name: 'og:type', content: 'website' },
    { kind: 'property', name: 'og:site_name', content: '[og:site_name] Jumo Placeholder' },
    { kind: 'property', name: 'og:locale', content: 'zh_TW' },
];

function imageAdvancedMeta(): MetaTag[] {
    const firstImageSubtags: MetaTag[] = [
        { kind: 'property', name: 'og:image:width', content: '1200' },
        { kind: 'property', name: 'og:image:height', content: '630' },
        { kind: 'property', name: 'og:image:alt', content: '[og:image:alt] 第一張 1200x630 的替代文字' },
    ];
    const extras: MetaTag[] = EXTRA_IMAGES.flatMap((img, i) => [
        { kind: 'property' as const, name: 'og:image', content: img.url },
        { kind: 'property' as const, name: 'og:image:width', content: String(img.width) },
        { kind: 'property' as const, name: 'og:image:height', content: String(img.height) },
        { kind: 'property' as const, name: 'og:image:alt', content: `[og:image:alt] 第${i + 2}張 ${img.alt}` },
    ]);
    return [...BASIC_OG, ...firstImageSubtags, ...extras];
}

function twitterCardMeta(): MetaTag[] {
    return [
        ...BASIC_OG,
        { kind: 'name', name: 'twitter:card', content: 'summary_large_image' },
        { kind: 'name', name: 'twitter:title', content: '[twitter:title] Placeholder Twitter 標題' },
        { kind: 'name', name: 'twitter:description', content: '[twitter:description] 這段文字來自 twitter:description，用來驗證 Discord 會不會用它覆寫 og:description。' },
        { kind: 'name', name: 'twitter:image', content: SAMPLE_IMAGE },
        { kind: 'name', name: 'twitter:site', content: '@jumo_placeholder_site' },
        { kind: 'name', name: 'twitter:creator', content: '@jumo_placeholder_creator' },
    ];
}

function articleMeta(): MetaTag[] {
    const withArticleType: MetaTag[] = BASIC_OG.map(tag =>
        tag.kind === 'property' && tag.name === 'og:type'
            ? { kind: 'property', name: 'og:type', content: 'article' }
            : tag
    );
    return [
        ...withArticleType,
        { kind: 'property', name: 'article:published_time', content: '2026-04-11T12:00:00+08:00' },
        { kind: 'property', name: 'article:modified_time', content: '2026-04-11T13:30:00+08:00' },
        { kind: 'property', name: 'article:author', content: '[article:author] Jumo Placeholder Author' },
        { kind: 'property', name: 'article:section', content: '[article:section] Tech' },
        { kind: 'property', name: 'article:tag', content: '[article:tag] opengraph' },
        { kind: 'property', name: 'article:tag', content: '[article:tag] discord-embed' },
    ];
}

function videoMeta(): MetaTag[] {
    const withVideoType: MetaTag[] = BASIC_OG.map(tag =>
        tag.kind === 'property' && tag.name === 'og:type'
            ? { kind: 'property', name: 'og:type', content: 'video.other' }
            : tag
    );
    return [
        ...withVideoType,
        { kind: 'property', name: 'og:video', content: SAMPLE_VIDEO },
        { kind: 'property', name: 'og:video:url', content: SAMPLE_VIDEO },
        { kind: 'property', name: 'og:video:secure_url', content: SAMPLE_VIDEO },
        { kind: 'property', name: 'og:video:type', content: 'video/mp4' },
        { kind: 'property', name: 'og:video:width', content: '1280' },
        { kind: 'property', name: 'og:video:height', content: '720' },
    ];
}

function fullMeta(): MetaTag[] {
    const baseImageAdvanced = imageAdvancedMeta().map(tag =>
        tag.kind === 'property' && tag.name === 'og:type'
            ? { kind: 'property' as const, name: 'og:type', content: 'article' }
            : tag
    );
    return [
        ...baseImageAdvanced,
        ...twitterCardMeta().filter(t => t.kind === 'name'),
        ...articleMeta().filter(
            t => t.kind === 'property' && t.name.startsWith('article:')
        ),
        ...videoMeta().filter(
            t => t.kind === 'property' && t.name.startsWith('og:video')
        ),
    ];
}

type PresetKey = 'full' | 'basic' | 'image-advanced' | 'twitter-card' | 'article' | 'video';

const PRESETS: Record<PresetKey, { title: string; description: string; meta: () => MetaTag[] }> = {
    'full': {
        title: 'Placeholder · Full',
        description: '一次塞入所有支援的 meta 欄位',
        meta: fullMeta,
    },
    'basic': {
        title: 'Placeholder · Basic',
        description: '最小 Open Graph 欄位',
        meta: () => BASIC_OG,
    },
    'image-advanced': {
        title: 'Placeholder · Image Advanced',
        description: '包含 og:image:width / height / alt 與多張 og:image',
        meta: imageAdvancedMeta,
    },
    'twitter-card': {
        title: 'Placeholder · Twitter Card',
        description: '基本 OG 加上 twitter:card 系列欄位',
        meta: twitterCardMeta,
    },
    'article': {
        title: 'Placeholder · Article',
        description: 'og:type=article 以及 article:* 欄位',
        meta: articleMeta,
    },
    'video': {
        title: 'Placeholder · Video',
        description: 'og:type=video.other 以及 og:video:* 欄位',
        meta: videoMeta,
    },
};

const PRESET_KEYS = Object.keys(PRESETS) as PresetKey[];

function renderMetaTag(tag: MetaTag): string {
    const attr = tag.kind === 'property' ? 'property' : 'name';
    return `  <meta ${attr}="${escapeHtml(tag.name)}" content="${escapeHtml(tag.content)}" />`;
}

function renderPage(presetKey: PresetKey, requestedPath: string, isFallback: boolean): string {
    const preset = PRESETS[presetKey];
    const metaTags = preset.meta();
    const metaHtml = metaTags.map(renderMetaTag).join('\n');

    const presetListItems = PRESET_KEYS
        .map(k => `    <li><a href="/${k}"><code>/${k}</code></a> — ${escapeHtml(PRESETS[k].description)}</li>`)
        .join('\n');

    const bodyMetaList = metaTags
        .map(t => `    <li><code>${t.kind === 'property' ? 'property' : 'name'}="${escapeHtml(t.name)}"</code> → <code>${escapeHtml(t.content)}</code></li>`)
        .join('\n');

    const fallbackNotice = isFallback
        ? `  <p style="color:#b00">⚠ 未匹配的 path <code>${escapeHtml(requestedPath)}</code>，已 fallback 至 <code>/full</code>。</p>\n`
        : '';

    return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(preset.title)}</title>
${metaHtml}
</head>
<body>
  <h1>${escapeHtml(preset.title)}</h1>
  <p>${escapeHtml(preset.description)}</p>
${fallbackNotice}  <h2>可用 preset</h2>
  <ul>
${presetListItems}
  </ul>
  <h2>本頁實際輸出的 meta 標籤</h2>
  <ul>
${bodyMetaList}
  </ul>
</body>
</html>`;
}

export const placeholderHandler = async (c: Context<{ Bindings: Bindings }>) => {
    const url = new URL(c.req.url);
    const path = url.pathname;

    const segment = path.replace(/^\/+/, '').split('/')[0] ?? '';
    const requestedKey = segment === '' ? 'full' : segment;
    const isKnown = (PRESET_KEYS as string[]).includes(requestedKey);
    const presetKey: PresetKey = isKnown ? (requestedKey as PresetKey) : 'full';
    const isFallback = !isKnown && segment !== '';

    console.log(`[placeholder] path=${path} preset=${presetKey} fallback=${isFallback}`);

    return c.html(renderPage(presetKey, path, isFallback));
};
