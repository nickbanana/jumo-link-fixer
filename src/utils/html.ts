export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderOgHtml(params: {
    title: string;
    description: string;
    url: string;
    images: string[];
    redirectUrl?: string;
}): string {
    const { title, description, url, images, redirectUrl } = params;
    const imageTags = images.map(img =>
        `  <meta property="og:image" content="${escapeHtml(img)}" />`
    ).join('\n');
    const redirect = redirectUrl
        ? `\n  <meta http-equiv="refresh" content="0; url=${escapeHtml(redirectUrl)}" />`
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
  <meta property="og:type" content="article" />
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
