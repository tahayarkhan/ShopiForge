import type { Product } from '@shopiforge/shared';
import { supabase } from '../lib/supabase.js';
import { mapProductRow, type ProductRow } from '../mappers/productMapper.js';

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