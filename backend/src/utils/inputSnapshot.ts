import type { Product, ProductInputSnapshot } from '@shopiforge/shared';

export function buildInputSnapshot(product: Product): ProductInputSnapshot {
    return {
        title: product.title,
        descriptionHtml: product.descriptionHtml ?? '',
        tags: product.tags ?? [],
        shopifyUpdatedAt: product.shopifyUpdatedAt,
    }
}