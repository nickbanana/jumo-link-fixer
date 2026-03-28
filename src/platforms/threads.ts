import { createPlatformHandler } from './base';

export const threadsHandler = createPlatformHandler({
    key: 'threads',
    domain: 'https://www.threads.com',
    stripParams: ['igsh', 'igshid', 'utm_*'],
});
