export interface Shop {
    id: string;
    shopifyDomain: string;
    shopifyShopId: string;
    accessTokenEncrypted: string;
    accessTokenIv: string;
    accessTokenTag: string;
    scopes: string[];
    plan: string;
    isActive: boolean;
    installedAt: string | null;
    uninstalledAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ShopSafe {
    id: string;
    shopifyDomain: string;
    plan: string;
    isActive: boolean;
}