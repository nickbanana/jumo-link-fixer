/**
 * Removes tracking query parameters from a URL.
 * Supports exact matches and wildcard prefixes (e.g. "utm_*").
 */
export function stripTrackingParams(url: string, patterns: string[]): string {
    const parsed = new URL(url);
    const keysToDelete: string[] = [];

    for (const key of parsed.searchParams.keys()) {
        for (const pattern of patterns) {
            if (pattern.endsWith('*')) {
                if (key.startsWith(pattern.slice(0, -1))) {
                    keysToDelete.push(key);
                    break;
                }
            } else if (key === pattern) {
                keysToDelete.push(key);
                break;
            }
        }
    }

    for (const key of keysToDelete) {
        parsed.searchParams.delete(key);
    }

    return parsed.toString();
}
