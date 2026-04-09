// Function name 常數（對應 defineFn 的第一個參數）
const FUNCTION_NAMES: Record<string, string> = {
    x: 'jumo-x',
    instagram: 'jumo-instagram',
    threads: 'jumo-threads',
    facebook: 'jumo-facebook',
};

export async function invokeBrowserbase(
    mode: string,
    functionId: string,
    platform: string,
    apiKey: string,
    params: { url: string; apiKey?: string }
): Promise<Response> {
    const identifier = mode === 'local'
        ? FUNCTION_NAMES[platform]
        : functionId;
    const baseUrl = mode === 'local'
        ? 'http://127.0.0.1:14113'
        : 'https://api.browserbase.com';
    const functionUrl = `${baseUrl}/v1/functions/${identifier}/invoke`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (mode !== 'local') {
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
    return response;
}
