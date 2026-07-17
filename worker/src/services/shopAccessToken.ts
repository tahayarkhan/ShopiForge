import { decryptSecret, type Shop } from '@shopiforge/shared';
import { env } from '../config/env.js';

export function getShopAccessToken(shop: Shop): string {
    return decryptSecret(
        {
            encrypted: shop.accessTokenEncrypted,
            iv: shop.accessTokenIv,
            tag: shop.accessTokenTag,
        },
        env.ENCRYPTION_KEY_BASE64,
    )
}