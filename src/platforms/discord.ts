import type { Context } from 'hono';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
import type { Bindings, BrowserbaseResult, PreviewJob } from '../types';
import { stripTrackingParams } from '../utils/strip-params';
import { invokeBrowserbase } from '../utils/browserbase';
import { detectPlatform } from '../utils/platform-detect';
import { buildComponents, buildFallbackComponents, IS_COMPONENTS_V2, type DiscordComponent } from '../utils/discord-embed';

const DISCORD_API = 'https://discord.com/api/v10';

// Browserbase 擷取在 Queue consumer（wall time 最長 15 分鐘）執行，故可長時間輪詢。
const QUEUE_POLL = { intervalMs: 3000, maxAttempts: 120 }; // 最長約 6 分鐘

// 擷取不到圖時的預設佔位圖。
const DEFAULT_IMAGE_URL = 'https://placehold.co/600x400/png';

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
        const options: { name: string; value: unknown }[] = interaction.data.options ?? [];
        const rawUrl: string = options.find((o) => o.name === 'url')?.value as string ?? '';
        // 未帶 `isspoiler` 選項時 value 為 undefined，預設不劇透（與指令註冊描述「預設關閉」一致）。
        const isSpoiler = options.find((o) => o.name === 'isspoiler')?.value === true;

        // 擷取交給 Queue consumer（wall time 最長 15 分鐘），先回 deferred 顯示「thinking…」。
        const job: PreviewJob = {
            applicationId: c.env.DISCORD_APPLICATION_ID || interaction.application_id,
            token: interaction.token,
            rawUrl,
            isSpoiler,
        };
        try {
            await c.env.jumo_link_queues.send(job);
        } catch (error) {
            console.error('[discord] Failed to enqueue preview job:', error);
        }

        return c.json({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
    }

    return c.text('unhandled interaction', 400);
}

// 由 Queue consumer 呼叫：擷取 metadata 並 PATCH 原始（deferred）回覆。
export async function runPreview(env: Bindings, job: PreviewJob) {
    const editUrl = `${DISCORD_API}/webhooks/${job.applicationId}/${job.token}/messages/@original`;

    const detected = detectPlatform(job.rawUrl);
    if (!detected) {
        await editOriginal(editUrl, { content: '無法辨識此連結的平台，請確認是 X / Instagram / Threads / Facebook 連結。' });
        return;
    }

    const originalUrl = stripTrackingParams(detected.originalUrl, detected.stripParams);
    const functionId = env[detected.functionIdEnvKey] as string;

    let components: DiscordComponent[];
    try {
        // 尚未部署 function（id 為空）→ 直接 fallback 內容。
        if (env.FUNCTION_MODE !== 'local' && !functionId) {
            components = buildFallbackComponents(detected.key, originalUrl);
        } else {
            const response = await invokeBrowserbase(
                env.FUNCTION_MODE,
                functionId,
                detected.key,
                env.BROWSERBASE_API_KEY,
                { url: originalUrl, apiKey: env.GOOGLE_API_KEY },
                QUEUE_POLL,
            );

            if (!response.ok) {
                console.error(`[discord] Browserbase invocation failed: ${response.status}`);
                components = buildFallbackComponents(detected.key, originalUrl);
            } else {
                const result = await response.json<BrowserbaseResult>();

                // 擷取不到圖時，預設補上佔位圖，確保內容除內文外一定有圖。
                if (!result.links || result.links.length === 0) {
                    result.links = [DEFAULT_IMAGE_URL];
                }

                components = (!result.content && !result.author)
                    ? buildFallbackComponents(detected.key, originalUrl)
                    : buildComponents(detected.key, originalUrl, result, job.isSpoiler);
            }
        }
    } catch (error) {
        console.error('[discord] Error:', error);
        components = buildFallbackComponents(detected.key, originalUrl);
    }

    await editOriginal(editUrl, { components, flags: IS_COMPONENTS_V2 });
}

// PATCH 原始（deferred）回應內容。
async function editOriginal(editUrl: string, body: { content?: string; components?: DiscordComponent[]; flags?: number }) {
    const res = await fetch(editUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        console.error(`[discord] Failed to edit original response: ${res.status} ${await res.text()}`);
    }
}
