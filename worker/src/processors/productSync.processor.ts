import type { ProductSyncJobPayload } from '@shopiforge/shared';
import { findActiveShopById } from '../repositories/shopRepository.js';
import { syncProductsForShop } from '../services/productSync.service.js';

export async function processProductSyncJob(
    payload: ProductSyncJobPayload,
):  Promise<void> {
    const { shopId, updatedAtMin, requestedAt } = payload;

    console.log(
        `[product-sync] start shopId=${shopId} requestedAt=${requestedAt}`,
    );

    const shop = await findActiveShopById(shopId);

    if (!shop) {
        console.warn(
          `[product-sync] skip shopId=${shopId}: not found or inactive`,
        );
        return;
    }

    const result = await syncProductsForShop({
        shopId,
        updatedAtMin, // undefined if omitted on payload → service resolves from DB
    });

    console.log(
        `[product-sync] done shopId=${shopId} mode=${result.mode} synced=${result.synced} domain=${result.shopifyDomain}`,
    );


}