import { supabase } from '../lib/supabase.js';
import { mapShopRow, type toShopSafe, type ShopRow } from '../mappers/shopMapper.js';
import type { Shop, ShopSafe } from '@shopiforge/shared';


export interface UpsertShopInstallInput {
    shopifyDomain: string;
    shopifyShopId: string;
    accessTokenEncrypted: string;
    accessTokenIv: string;
    accessTokenTag: string;
    scopes: string[];
}


export async function findShopByDomain(shopifyDomain: string): Promise<Shop | null> {
    
    const { data, error } = await supabase.from('shops').select('*').eq('shopify_domain', shopifyDomain).maybeSingle();

    if (error) {
        throw new Error(`findShopByDomain failed: ${error.message}`);
    }

    return data ? mapShopRow(data as ShopRow) : null;

}

export async function findActiveShopById(id: string): Promise<Shop | null> {
    const { data, error } = await supabase.from('shops').select('*').eq('id', id).eq('is_active', true).maybeSingle();

    if (error) {
        throw new Error(`findActiveShopById failed: ${error.message}`);
    }

    return data ? mapShopRow(data as ShopRow) : null;
}

export async function upsertShopInstall(input: UpsertShopInstallInput): Promise<Shop> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('shops')
        .upsert(
            {
                shopify_domain: input.shopifyDomain,
                shopify_shop_id: input.shopifyShopId,
                access_token_encrypted: input.accessTokenEncrypted,
                access_token_iv: input.accessTokenIv,
                access_token_tag: input.accessTokenTag,
                scopes: input.scopes,
                is_active: true,
                installed_at: now,
                uninstalled_at: null,
                updated_at: now,
            },
            { onConflict: 'shopify_domain' }
        )
        .select('*')
        .single();

        if (error) {
            throw new Error(`upsertShopInstall failed: ${error.message}`);
        }

        return mapShopRow(data as ShopRow);
}

export async function markShopInactive(shopifyDomain: string): Promise<void> {

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('shops')
        .update({
            is_active: false,
            uninstalled_at: now,
            updated_at: now,
        })
        .eq('shopify_domain', shopifyDomain)
    
        if (error) {
        throw new Error(`markShopInactive failed: ${error.message}`);
    }
}