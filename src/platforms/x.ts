import { createPlatformHandler } from './base';

export const xHandler = createPlatformHandler({
    key: 'x',
    domain: 'https://x.com',
    stripParams: ['s', 't', 'ref_src', 'ref_url', 'utm_*'],
});
