import type { Shop } from '@shopiforge/shared';

export interface ShopRow {
    id: string;
    shopify_domain: string;
    shopify_shop_id: string | null;
    access_token_encrypted: string;
    access_token_iv: string;
    access_token_tag: string;
    scopes: string[];
    plan: string;
    is_active: boolean;
    installed_at: string | null;
    uninstalled_at: string | null;
    created_at: string;
    updated_at: string;
}

export function mapShopRow(row: ShopRow): Shop {

    return {
        id: row.id,
        shopifyDomain: row.shopify_domain,
        shopifyShopId: row.shopify_shop_id ?? '',
        accessTokenEncrypted: row.access_token_encrypted,
        accessTokenIv: row.access_token_iv,
        accessTokenTag: row.access_token_tag,
        scopes: row.scopes ?? [],
        plan: row.plan,
        isActive: row.is_active,
        installedAt: row.installed_at,
        uninstalledAt: row.uninstalled_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }

}