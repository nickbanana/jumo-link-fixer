import { createPlatformHandler } from './base';

export const instagramHandler = createPlatformHandler({
    key: 'instagram',
    domain: 'https://www.instagram.com',
    stripParams: ['igsh', 'igshid', 'utm_*'],
});
