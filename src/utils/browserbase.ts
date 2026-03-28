export async function invokeBrowserbase(
    functionId: string,
    apiKey: string,
    params: { url: string; platform: string }
): Promise<Response> {
    const functionUrl = `https://api.browserbase.com/v1/functions/${functionId}/invoke`;
    const invokePayload = {
        method: 'POST' as const,
        headers: {
            'Content-Type': 'application/json',
            'x-bb-api-key': apiKey,
        },
        body: JSON.stringify({ params }),
    };

    let response = await fetch(functionUrl, invokePayload);
    if (!response.ok) {
        console.error(`Function invocation failed: ${response.status}, retrying...`);
        response = await fetch(functionUrl, invokePayload);
    }
    return response;
}
