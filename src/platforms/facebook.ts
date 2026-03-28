import { createPlatformHandler } from './base';

export const facebookHandler = createPlatformHandler({
    key: 'facebook',
    domain: 'https://www.facebook.com',
    stripParams: ['fbclid', 'utm_*'],
});
