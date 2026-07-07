import { decryptSecret } from '@shopiforge/shared';
import { env } from '../config/env.js';
import { findActiveShopById } from '../repositories/shopRepository.js';
import {
  upsertProductsForShop,
  type UpsertProductInput,
} from '../repositories/productRepository.js';
import { fetchAllProducts, type ShopifyProductForSync } from './shopifyClient.js';

function toUpsertInput(product: ShopifyProductForSync): UpsertProductInput {
    return {
      shopifyProductId: product.shopifyProductId,
      shopifyGid: product.shopifyGid,
      title: product.title,
      descriptionHtml: product.descriptionHtml,
      tags: product.tags,
      vendor: product.vendor,
      productType: product.productType,
      status: product.status,
      handle: product.handle,
      images: product.images,
      variantsSummary: product.variantsSummary,
      shopifyUpdatedAt: product.shopifyUpdatedAt,
    };
}

export async function syncProductsForShop(shopId: string): Promise<{
    synced: number;
    shopifyDomain: string;
    lastSyncedAt: string;
  }> {

    const shop = await findActiveShopById(shopId);

    if (!shop) {
        throw new Error('Shop not found or inactive');
    }

    const accessToken = decryptSecret(
        {
            encrypted: shop.accessTokenEncrypted,
            iv: shop.accessTokenIv,
            tag: shop.accessTokenTag,
        },
        env.ENCRYPTION_KEY_BASE64
    );

    const products = await fetchAllProducts({
        shopifyDomain: shop.shopifyDomain,
        accessToken,
        apiVersion: env.SHOPIFY_API_VERSION,
    });

    const synced = await upsertProductsForShop(
        shop.id,
        products.map(toUpsertInput)    
    );

    const lastSyncedAt = new Date().toISOString();


    return {
        synced,
        shopifyDomain: shop.shopifyDomain,
        lastSyncedAt,
    };


}