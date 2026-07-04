import type { Product, ProductImage, VariantSummary } from '@shopiforge/shared';

export interface ProductRow {
    id: string;
    shop_id: string;
    shopify_product_id: string;
    shopify_gid: string;
    title: string;
    description_html: string | null;
    tags: string[] | null;
    vendor: string | null;
    product_type: string | null;
    status: string | null;
    handle: string | null;
    images: ProductImage[] | null;
    variants_summary: VariantSummary[] | null;
    shopify_updated_at: string | null;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
  }
  
export function mapProductRow(row: ProductRow): Product {
    return {
      id: row.id,
      shopId: row.shop_id,
      shopifyProductId: row.shopify_product_id,
      shopifyGid: row.shopify_gid,
      title: row.title,
      descriptionHtml: row.description_html,
      tags: row.tags ?? [],
      vendor: row.vendor,
      productType: row.product_type,
      status: row.status,
      handle: row.handle,
      images: row.images ?? [],
      variantsSummary: row.variants_summary ?? [],
      shopifyUpdatedAt: row.shopify_updated_at,
      lastSyncedAt: row.last_synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
}