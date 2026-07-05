import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { encryptSecret } from '@shopiforge/shared';
import { upsertShopInstall } from '../repositories/shopRepository.js';
import { normalizeShopDomain } from '../utils/shopifyDomain.js';

const hostName = new URL(env.SHOPIFY_APP_URL).host;

export const shopify = shopifyApi({
    apiKey: env.SHOPIFY_API_KEY,
    apiSecretKey: env.SHOPIFY_API_SECRET,
    scopes: env.SHOPIFY_SCOPES.split(',').map((s) => s.trim()),
    hostName,
    apiVersion: env.SHOPIFY_API_VERSION as ApiVersion,
    isEmbeddedApp: false,
});

export const SHOPIFY_CALLBACK_PATH = '/api/v1/shopify/auth/callback';

export async function beginInstall(req: Request, res: Response, shopDomain: string): Promise<void> {
    await shopify.auth.begin({
        shop: shopDomain,
        callbackPath: SHOPIFY_CALLBACK_PATH,
        isOnline: false,
        rawRequest: req,
        rawResponse: res,
    })
}

async function fetchShopifyShopId(shopDomain: string, accessToken:string): Promise<string> {
    const response = await fetch(
        `https://${shopDomain}/admin/api/${env.SHOPIFY_API_VERSION}/graphql.json`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            },
            body: JSON.stringify({
                query: '{ shop { id } }',
            }),
        },
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch shop id: ${response.status}`);
    }

    const json = (await response.json()) as {
        data?: { shop?: { id?: string } };
        errors?: unknown;
    };

    const gid = json.data?.shop?.id;
    if (!gid) {
        throw new Error('Shop id missing from Shopify response');
    }

    return gid.split('/').pop() ?? gid;

}

export async function completeInstall(req: Request, res: Response): Promise<string> {
    const { session } = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
    });

    const accessToken = session.accessToken;
    
    if (!accessToken) {
        throw new Error('Missing access token from Shopify OAuth callback');
    }

    const shopDomain = normalizeShopDomain(session.shop);

    const secret = encryptSecret(accessToken, env.ENCRYPTION_KEY_BASE64);

    const shopifyShopId = await fetchShopifyShopId(shopDomain, accessToken);


    const scopes =
        session.scope?.split(',').map((s) => s.trim()).filter(Boolean) ??
        env.SHOPIFY_SCOPES.split(',').map((s) => s.trim());

    const shop = await upsertShopInstall({
        shopifyDomain: shopDomain,
        shopifyShopId,
        accessTokenEncrypted: secret.encrypted,
        accessTokenIv: secret.iv,
        accessTokenTag: secret.tag,
        scopes,
    })

    return shop.id;

}

