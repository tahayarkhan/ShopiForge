import type { Product, ProductImage, VariantSummary } from '@shopiforge/shared';
import { supabase } from '../lib/supabase.js';
import { mapProductRow, type ProductRow } from '../mappers/productMapper.js';

export interface UpsertProductInput {
    shopifyProductId: string;
    shopifyGid: string;
    title: string;
    descriptionHtml: string | null;
    tags: string[];
    vendor: string | null;
    productType: string | null;
    status: string | null;
    handle: string | null;
    images: ProductImage[];
    variantsSummary: VariantSummary[];
    shopifyUpdatedAt: string | null;
}

export async function findProductById(productId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();
    if (error) {
      throw new Error(`findProductById failed: ${error.message}`);
    }
    return data ? mapProductRow(data as ProductRow) : null;
}

export async function updateProductAfterShopifyPush(input: {
    productId: string;
    title: string;
    descriptionHtml: string | null;
    tags: string[];
    shopifyUpdatedAt: string | null;
}): Promise<Product> {
    
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('products')
        .update({
            title: input.title,
            description_html: input.descriptionHtml,
            tags: input.tags,
            shopify_updated_at: input.shopifyUpdatedAt,
            last_synced_at: now,
            updated_at: now,
        })
        .eq('id', input.productId)
        .select('*')
        .single();

    if (error) {
        throw new Error(`updateProductAfterShopifyPush failed: ${error.message}`);
    }

    return mapProductRow(data as ProductRow);

}

export async function resolveUpdatedAtMin(shopId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('products')
        .select('last_synced_at')
        .eq('shop_id', shopId)
        .not('last_synced_at', 'is', null)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error) {
        throw new Error(`resolveUpdatedAtMin failed: ${error.message}`);
    }

    return data?.last_synced_at ?? null;

}

export async function upsertProductsForShop(
    shopId: string,
    products: UpsertProductInput[],
  ): Promise<number> {
    if (products.length === 0) return 0;
    const now = new Date().toISOString();
    const rows = products.map((product) => ({
      shop_id: shopId,
      shopify_product_id: product.shopifyProductId,
      shopify_gid: product.shopifyGid,
      title: product.title,
      description_html: product.descriptionHtml,
      tags: product.tags,
      vendor: product.vendor,
      product_type: product.productType,
      status: product.status,
      handle: product.handle,
      images: product.images,
      variants_summary: product.variantsSummary,
      shopify_updated_at: product.shopifyUpdatedAt,
      last_synced_at: now,
      updated_at: now,
    }));
    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'shop_id,shopify_product_id' });
    if (error) {
      throw new Error(`upsertProductsForShop failed: ${error.message}`);
    }
    return products.length;
}



  