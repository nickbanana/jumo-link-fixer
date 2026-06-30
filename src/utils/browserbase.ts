// Function name 常數（對應 defineFn 的第一個參數）
const FUNCTION_NAMES: Record<string, string> = {
    x: 'jumo-x',
    instagram: 'jumo-instagram',
    threads: 'jumo-threads',
    facebook: 'jumo-facebook',
};

// 生產環境為非同步調用：POST 後需輪詢直到 COMPLETED。
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 12; // 約 24 秒上限，Discord deferred 回應允許更久但 Worker 不宜久等

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function invokeBrowserbase(
    mode: string,
    functionId: string,
    platform: string,
    apiKey: string,
    params: { url: string; apiKey?: string }
): Promise<Response> {
    const isLocal = mode === 'local';
    const identifier = isLocal ? FUNCTION_NAMES[platform] : functionId;
    const baseUrl = isLocal ? 'http://127.0.0.1:14113' : 'https://api.browserbase.com';
    const functionUrl = `${baseUrl}/v1/functions/${identifier}/invoke`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (!isLocal) {
        headers['x-bb-api-key'] = apiKey;
    }

    const invokePayload = {
        method: 'POST' as const,
        headers,
        body: JSON.stringify({ params }),
    };

    let response = await fetch(functionUrl, invokePayload);
    if (!response.ok) {
        console.error(`Function invocation failed: ${response.status}, retrying...`);
        response = await fetch(functionUrl, invokePayload);
    }

    // 本地開發伺服器為同步執行，直接回傳函式結果。
    if (isLocal || !response.ok) {
        return response;
    }

    // 生產環境：POST 只回傳 invocation 資訊（status 多為 PENDING/RUNNING），需輪詢取結果。
    let invocation = await response.json<BrowserbaseInvocation>();
    const invocationId = invocation?.id;
    if (!invocationId) {
        console.error('Browserbase invoke response missing invocation id');
        return new Response(null, { status: 502 });
    }

    const pollUrl = `${baseUrl}/v1/functions/invocations/${invocationId}`;
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
        if (invocation?.status === 'COMPLETED') {
            return new Response(JSON.stringify(unwrapResults(invocation.results)), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        if (invocation?.status === 'FAILED') {
            console.error('Browserbase invocation FAILED');
            return new Response(null, { status: 502 });
        }

        await sleep(POLL_INTERVAL_MS);

        const pollRes = await fetch(pollUrl, { method: 'GET', headers });
        if (!pollRes.ok) {
            console.error(`Browserbase poll failed: ${pollRes.status}`);
            return pollRes;
        }
        invocation = await pollRes.json<BrowserbaseInvocation>();
    }

    console.error('Browserbase invocation timed out');
    return new Response(null, { status: 504 });
}

type BrowserbaseInvocation = {
    id?: string;
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    results?: unknown;
};

// results 可能為 { success, data } 或直接是結果物件，兩種形狀都解開。
function unwrapResults(results: unknown): unknown {
    if (results && typeof results === 'object' && 'data' in results) {
        return (results as { data: unknown }).data;
    }
    return results ?? {};
}
