export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export type OgImage = {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
};

export function renderOgHtml(params: {
    title: string;
    description: string;
    url: string;
    images: (string | OgImage)[];
    siteName?: string;
    type?: string;
    locale?: string;
    redirectUrl?: string;
}): string {
    const { title, description, url, images, siteName, type = 'article', locale, redirectUrl } = params;
    const imageTags = images.map(img => {
        const o = typeof img === 'string' ? { url: img } : img;
        const lines = [`  <meta property="og:image" content="${escapeHtml(o.url)}" />`];
        if (o.width != null)
            lines.push(`  <meta property="og:image:width" content="${o.width}" />`);
        if (o.height != null)
            lines.push(`  <meta property="og:image:height" content="${o.height}" />`);
        if (o.alt)
            lines.push(`  <meta property="og:image:alt" content="${escapeHtml(o.alt)}" />`);
        return lines.join('\n');
    }).join('\n');
    const redirect = redirectUrl
        ? `\n  <meta http-equiv="refresh" content="0; url=${escapeHtml(redirectUrl)}" />`
        : '';
    const siteNameTag = siteName
        ? `\n  <meta property="og:site_name" content="${escapeHtml(siteName)}" />`
        : '';
    const localeTag = locale
        ? `\n  <meta property="og:locale" content="${escapeHtml(locale)}" />`
        : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />${redirect}
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
${imageTags}
  <meta property="og:type" content="${escapeHtml(type)}" />${siteNameTag}${localeTag}
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(redirectUrl ?? url)}">${escapeHtml(redirectUrl ?? url)}</a>…</p>
</body>
</html>`;
}

export function renderErrorHtml(url: string, status: number): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta property="og:title" content="無法載入預覽"/>
<meta property="og:description" content="擷取 ${escapeHtml(url)} 時發生錯誤，請稍後再試。"/>
</head><body><p>Error ${status}</p></body></html>`;
}
