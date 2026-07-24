import { env } from '../config/env.js';
import { findActiveShopById } from '../repositories/shopRepository.js';
import {
  resolveUpdatedAtMin,
  upsertProductsForShop,
  type UpsertProductInput,
} from '../repositories/productRepository.js';
import { getShopAccessToken } from './shopAccessToken.js';
import {
  fetchAllProducts,
  type ShopifyProductForSync,
} from './shopifyClient.js';

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

export async function syncProductsForShop(input: {
    shopId: string;
    updatedAtMin?: string | null;
}): Promise<{
    synced: number;
    shopifyDomain: string;
    mode: 'full' | 'incremental';
    updatedAtMin: string | null;
}> {

    const shop = await findActiveShopById(input.shopId);

    if (!shop) {
        throw new Error('Shop not found or inactive');
    }

    const updatedAtMin = 
        input.updatedAtMin !== undefined
            ? input.updatedAtMin
            : await resolveUpdatedAtMin(shop.id);
    
    const mode = updatedAtMin ? 'incremental' : 'full';

    const accessToken = getShopAccessToken(shop);


    const products = await fetchAllProducts(
        {
            shopifyDomain: shop.shopifyDomain,
            accessToken,
            apiVersion: env.SHOPIFY_API_VERSION,
        },
        { updatedAtMin },
    );

    const synced = await upsertProductsForShop(
        shop.id,
        products.map(toUpsertInput),
    );

    return {
        synced,
        shopifyDomain: shop.shopifyDomain,
        mode,
        updatedAtMin,
    };

}