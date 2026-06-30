import type { Context } from 'hono';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
import type { Bindings, BrowserbaseResult } from '../types';
import { stripTrackingParams } from '../utils/strip-params';
import { invokeBrowserbase } from '../utils/browserbase';
import { detectPlatform } from '../utils/platform-detect';
import { buildEmbeds, buildFallbackEmbed, type DiscordEmbed } from '../utils/discord-embed';

const DISCORD_API = 'https://discord.com/api/v10';

// Discord interactions 端點。驗證簽章 → PING/PONG → /preview 指令（deferred + 背景擷取）。
export async function discordHandler(c: Context<{ Bindings: Bindings }>) {
    const signature = c.req.header('X-Signature-Ed25519');
    const timestamp = c.req.header('X-Signature-Timestamp');
    const rawBody = await c.req.text();

    if (!signature || !timestamp) {
        return c.text('missing signature headers', 401);
    }

    const isValid = await verifyKey(rawBody, signature, timestamp, c.env.DISCORD_PUBLIC_KEY);
    if (!isValid) {
        return c.text('invalid request signature', 401);
    }

    const interaction = JSON.parse(rawBody);

    if (interaction.type === InteractionType.PING) {
        return c.json({ type: InteractionResponseType.PONG });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data?.name === 'preview') {
        const option = (interaction.data.options ?? []).find((o: { name: string }) => o.name === 'url');
        const rawUrl: string = option?.value ?? '';

        // 背景擷取並編輯原始回應；先回 deferred 讓 Discord 顯示「thinking…」。
        c.executionCtx.waitUntil(handlePreview(c.env, interaction, rawUrl));

        return c.json({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
    }

    return c.text('unhandled interaction', 400);
}

async function handlePreview(
    env: Bindings,
    interaction: { application_id: string; token: string },
    rawUrl: string,
) {
    const applicationId = env.DISCORD_APPLICATION_ID || interaction.application_id;
    const editUrl = `${DISCORD_API}/webhooks/${applicationId}/${interaction.token}/messages/@original`;

    const detected = detectPlatform(rawUrl);
    if (!detected) {
        await editOriginal(editUrl, { content: '無法辨識此連結的平台，請確認是 X / Instagram / Threads / Facebook 連結。' });
        return;
    }

    const originalUrl = stripTrackingParams(detected.originalUrl, detected.stripParams);
    const functionId = env[detected.functionIdEnvKey] as string;

    let embeds: DiscordEmbed[];
    try {
        // 尚未部署 function（id 為空）→ 直接 fallback embed。
        if (env.FUNCTION_MODE !== 'local' && !functionId) {
            embeds = [buildFallbackEmbed(detected.key, originalUrl)];
        } else {
            const response = await invokeBrowserbase(
                env.FUNCTION_MODE,
                functionId,
                detected.key,
                env.BROWSERBASE_API_KEY,
                { url: originalUrl, apiKey: env.GOOGLE_API_KEY },
            );

            if (!response.ok) {
                console.error(`[discord] Browserbase invocation failed: ${response.status}`);
                embeds = [buildFallbackEmbed(detected.key, originalUrl)];
            } else {
                const result = await response.json<BrowserbaseResult>();
                embeds = (!result.content && !result.author)
                    ? [buildFallbackEmbed(detected.key, originalUrl)]
                    : buildEmbeds(detected.key, originalUrl, result);
            }
        }
    } catch (error) {
        console.error('[discord] Error:', error);
        embeds = [buildFallbackEmbed(detected.key, originalUrl)];
    }

    await editOriginal(editUrl, { embeds });
}

// PATCH 原始（deferred）回應內容。
async function editOriginal(editUrl: string, body: { content?: string; embeds?: DiscordEmbed[] }) {
    const res = await fetch(editUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        console.error(`[discord] Failed to edit original response: ${res.status} ${await res.text()}`);
    }
}
