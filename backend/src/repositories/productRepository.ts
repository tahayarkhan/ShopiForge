import { supabase } from '../lib/supabase.js'; 
import type { Product, ProductImage, VariantSummary } from '@shopiforge/shared';
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


export async function listProductsByShop(shopId: string): Promise<Product[]> {
    const { data, error } = await supabase 
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('updated_at', { ascending: false });

    if (error) {
        throw new Error(`listProductsByShop failed: ${error.message}`);
    }

    return (data as ProductRow[]).map(mapProductRow);
}

export async function upsertProductsForShop(shopId: string, products: UpsertProductInput[]): Promise<number> {
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

export async function findProductByIdForShop(
    productId: string,
    shopId: string,
): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('shop_id', shopId)
        .maybeSingle();
  
    if (error) {
        throw new Error(`findProductByIdForShop failed: ${error.message}`);
    }
  
    return data ? mapProductRow(data as ProductRow) : null;
}
